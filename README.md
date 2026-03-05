# ⚡ FormAI: AI-Powered Google Form Generator

**Generate ready-to-use Google Forms in seconds from simple text prompts.**

FormAI leverages the power of Large Language Models (LLMs) and the Google Forms API to transform your ideas into structured, professional forms directly in your Google Drive. Whether you're an educator creating quizzes, a student gathering research data, or a professional running surveys, FormAI streamlines the process instantly.

---

## ✨ Key Features

-   **Prompt-to-Form**: Describe your form in plain English (e.g., "Create a 5-question quiz about the water cycle with MCQs").
-   **Direct Google Integration**: Forms are created directly in your Google Drive.
-   **Instant Sharing**: Get a respondent link and an edit link as soon as the form is generated.
-   **Modern UI**: A sleek, dark-themed, glassmorphic interface for a premium experience.
-   **Secure Authentication**: Uses Google OAuth to ensure your forms belong to you.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
-   **AI Engine**: [Groq SDK](https://groq.com/) (using advanced LLMs)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
-   **APIs**: Google Forms API, Google Drive API
-   **Styling**: Vanilla CSS with modern design principles (Glassmorphism, CSS Variables)

---

## 🚀 Getting Started

### Prerequisites

-   A Google Cloud Project with **Google Forms API** and **Google Drive API** enabled.
-   OAuth 2.0 Credentials (Client ID and Secret) from Google Cloud Console.
-   A Groq API Key.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/aadityasamani/google-form-builder-ai.git
    cd google-form-builder-ai/app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the `app` directory and add the following:
    ```env
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000
    GROQ_API_KEY=your_groq_api_key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📝 Usage

1.  **Sign In**: Connect your Google account using the "Continue with Google" button.
2.  **Enter Prompt**: Describe the form you need in the text area.
3.  **Generate**: Click "Generate Form" and wait a few seconds.
4.  **Review**: Open the form link to see your new Google Form or the edit link to make manual adjustments.

---

## 📄 License

This project is private and for demonstration purposes.

---

*Built with ⚡ by FormAI Team.*
