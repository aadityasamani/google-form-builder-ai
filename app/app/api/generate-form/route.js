import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { google } from "googleapis";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Re-use same NextAuth config
const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope:
                        "openid email profile https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/drive.file",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: "You must be signed in with Google to generate forms." },
                { status: 401 }
            );
        }

        const userGroqKey = req.headers.get("x-groq-api-key");
        if (!userGroqKey) {
            return NextResponse.json(
                { error: "Please provide a valid Groq API Key in your settings." },
                { status: 400 }
            );
        }

        const groq = new Groq({ apiKey: userGroqKey });

        const { prompt } = await req.json();

        if (!prompt || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: "Please provide a prompt." },
                { status: 400 }
            );
        }

        // Step 1: Use Groq to convert prompt → structured form JSON
        let groqResponse;
        try {
            groqResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an expert at generating Google Form schemas from natural language prompts.
Given a user's prompt, return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
  "title": "Form title here",
  "description": "Brief form description",
  "questions": [
    {
      "title": "Question text here",
      "type": "MULTIPLE_CHOICE" | "TEXT" | "PARAGRAPH_TEXT" | "CHECKBOX" | "DROPDOWN" | "SCALE",
      "required": true | false,
      "options": ["Option 1", "Option 2"] // only for MULTIPLE_CHOICE, CHECKBOX, DROPDOWN
    }
  ]
}

Rules:
- Generate 3-10 questions based on the prompt
- Use appropriate question types:
  - TEXT for short answers (name, email etc.)
  - PARAGRAPH_TEXT for long answers (feedback, explanation)
  - MULTIPLE_CHOICE for single-select questions
  - CHECKBOX for multi-select questions
  - DROPDOWN for long lists of choices
  - SCALE for rating questions (1-5 or 1-10 scale)
- Make options array ONLY for MULTIPLE_CHOICE, CHECKBOX, DROPDOWN types
- Do NOT include options for TEXT, PARAGRAPH_TEXT, or SCALE types
- For SCALE type, add "low": "1", "high": "5" fields instead of options
- Return ONLY the JSON object, nothing else`,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });
        } catch (groqError) {
             console.error("Groq API Error:", groqError);
             return NextResponse.json(
                 { error: "Failed to connect to Groq. Please check if your API key is correct and valid." },
                 { status: 400 }
             );
        }

        let formSchema;
        try {
            const rawText = groqResponse.choices[0].message.content.trim();
            // Strip any markdown code blocks if present
            const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            formSchema = JSON.parse(jsonText);
        } catch {
            return NextResponse.json(
                { error: "AI returned an invalid format. Please try again with a clearer prompt." },
                { status: 500 }
            );
        }

        // Step 2: Create the form using Google Forms API
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: session.accessToken });

        const forms = google.forms({ version: "v1", auth });

        // Create the base form
        const createResponse = await forms.forms.create({
            requestBody: {
                info: {
                    title: formSchema.title,
                    documentTitle: formSchema.title,
                },
            },
        });

        const formId = createResponse.data.formId;

        // Build batchUpdate requests
        const requests = [];

        // Update description if present
        if (formSchema.description) {
            requests.push({
                updateFormInfo: {
                    info: {
                        description: formSchema.description,
                    },
                    updateMask: "description",
                },
            });
        }

        // Add each question
        formSchema.questions.forEach((question, index) => {
            const item = {
                title: question.title,
                questionItem: {
                    question: {
                        required: question.required !== false,
                    },
                },
            };

            switch (question.type) {
                case "TEXT":
                    item.questionItem.question.textQuestion = { paragraph: false };
                    break;
                case "PARAGRAPH_TEXT":
                    item.questionItem.question.textQuestion = { paragraph: true };
                    break;
                case "MULTIPLE_CHOICE":
                    item.questionItem.question.choiceQuestion = {
                        type: "RADIO",
                        options: (question.options || []).map((opt) => ({ value: opt })),
                    };
                    break;
                case "CHECKBOX":
                    item.questionItem.question.choiceQuestion = {
                        type: "CHECKBOX",
                        options: (question.options || []).map((opt) => ({ value: opt })),
                    };
                    break;
                case "DROPDOWN":
                    item.questionItem.question.choiceQuestion = {
                        type: "DROP_DOWN",
                        options: (question.options || []).map((opt) => ({ value: opt })),
                    };
                    break;
                case "SCALE":
                    item.questionItem.question.scaleQuestion = {
                        low: 1,
                        high: 5,
                        lowLabel: question.low || "Poor",
                        highLabel: question.high || "Excellent",
                    };
                    break;
                default:
                    item.questionItem.question.textQuestion = { paragraph: false };
            }

            requests.push({
                createItem: {
                    item,
                    location: { index },
                },
            });
        });

        // Execute batchUpdate
        await forms.forms.batchUpdate({
            formId,
            requestBody: { requests },
        });

        // Get the final form details
        const finalForm = await forms.forms.get({ formId });
        const responderUri = finalForm.data.responderUri;
        const editUri = `https://docs.google.com/forms/d/${formId}/edit`;

        return NextResponse.json({
            success: true,
            formId,
            formTitle: formSchema.title,
            formDescription: formSchema.description,
            responderUrl: responderUri,
            editUrl: editUri,
            questionCount: formSchema.questions.length,
        });
    } catch (error) {
        console.error("Form generation error:", error);

        // Handle specific Google API errors
        if (error.code === 401 || error.status === 401) {
            return NextResponse.json(
                { error: "Google session expired. Please sign out and sign in again." },
                { status: 401 }
            );
        }

        if (error.code === 403 || error.status === 403) {
            return NextResponse.json(
                {
                    error:
                        "Permission denied. Make sure you granted access to Google Forms when signing in.",
                },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
