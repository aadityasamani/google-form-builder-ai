"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const EXAMPLE_PROMPTS = [
  "Quiz about the water cycle with 5 MCQs",
  "Student feedback form for online class",
  "Event registration form for college fest",
  "Teacher satisfaction survey with rating questions",
  "Science assignment submission form",
];

export default function Home() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [groqKey, setGroqKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Load saved key on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("groqApiKey");
      if (savedKey) setGroqKey(savedKey);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    if (!groqKey.trim()) {
      setError("Please provide your Groq API Key in settings.");
      setShowKeyInput(true);
      return;
    }

    try {
      const res = await fetch("/api/generate-form", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-groq-api-key": groqKey.trim() 
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleExampleClick = (example) => {
    setPrompt(example);
    setResult(null);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  const isSignedIn = status === "authenticated";

  return (
    <div className="page-container">
      {/* Background decorations */}
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            Form<span>AI</span>
          </div>
        </div>
        <div className="navbar-right">
          {isSignedIn && (
            <>
              <div className="user-info">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="user-avatar"
                  />
                )}
                <span className="user-name">{session.user?.name}</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setShowKeyInput(!showKeyInput)}
                title="API Settings"
              >
                ⚙️
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => signOut()}
                id="signout-btn"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Settings Panel */}
        {isSignedIn && showKeyInput && (
          <section className="settings-panel" style={{
            background: "var(--bg-card)",
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            marginBottom: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Groq API Configuration</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              To generate forms without limits, please provide your own free Groq API Key. 
              <br/>
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>Get your key here</a> (it's free!).
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input
                type="password"
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxx"
                value={groqKey}
                onChange={(e) => {
                  setGroqKey(e.target.value);
                  localStorage.setItem("groqApiKey", e.target.value);
                }}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)"
                }}
              />
              <button 
                className="btn btn-primary"
                onClick={() => {
                  localStorage.setItem("groqApiKey", groqKey);
                  setShowKeyInput(false);
                }}
              >
                Save
              </button>
            </div>
          </section>
        )}

        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <span className="dot" />
            AI Powered · Free to Use
          </div>
          <h1>
            Generate Google Forms
            <br />
            <span className="gradient-text">from any prompt</span>
          </h1>
          <p>
            Describe the form you need in plain English. FormAI creates a real
            Google Form in your Drive — instantly. Perfect for teachers,
            students, and anyone who needs forms fast.
          </p>
        </section>

        {/* Prompt Card (if signed in) */}
        {isSignedIn ? (
          <>
            <div className="prompt-card">
              <div className="prompt-label">
                <span className="label-icon">✏️</span>
                Describe your form
              </div>

              <textarea
                id="prompt-input"
                className="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g. Create a 5-question quiz about photosynthesis with multiple choice answers..."
                disabled={loading}
                maxLength={1000}
              />

              <div className="prompt-examples">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    className="example-chip"
                    onClick={() => handleExampleClick(ex)}
                    type="button"
                    disabled={loading}
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <div className="prompt-actions">
                <span className="char-count">{prompt.length}/1000 · Ctrl+Enter to generate</span>
                <button
                  id="generate-btn"
                  className="btn btn-primary btn-lg"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      Generating…
                    </>
                  ) : (
                    <>⚡ Generate Form</>
                  )}
                </button>
              </div>

              {loading && (
                <>
                  <div className="loading-bar">
                    <div className="loading-bar-fill" />
                  </div>
                  <div className="loading-text">
                    <div className="spinner" />
                    AI is crafting your form — usually takes 10-20 seconds…
                  </div>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="error-card" id="error-display" role="alert">
                <span className="error-icon">⚠️</span>
                <div>
                  <div className="error-title">Something went wrong</div>
                  <div className="error-message">{error}</div>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="result-card" id="result-display">
                <div className="result-header">
                  <div className="result-icon">✅</div>
                  <div>
                    <div className="result-title">{result.formTitle}</div>
                    <div className="result-subtitle">
                      Your Google Form is ready!
                    </div>
                  </div>
                </div>

                <div className="result-stats">
                  <span className="stat-badge">
                    <span className="stat-icon">❓</span>
                    {result.questionCount} Questions
                  </span>
                  <span className="stat-badge">
                    <span className="stat-icon">📁</span>
                    Saved to your Drive
                  </span>
                  <span className="stat-badge">
                    <span className="stat-icon">🔗</span>
                    Shareable Link Ready
                  </span>
                </div>

                <div className="result-divider" />

                <div className="form-url-label">Respondent Link (share this)</div>
                <div className="form-url-row">
                  <div className="form-url-box" id="form-url">
                    {result.responderUrl}
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => handleCopy(result.responderUrl)}
                    title="Copy link"
                    id="copy-link-btn"
                  >
                    {copied ? "✅" : "📋"}
                  </button>
                </div>

                {copied && (
                  <div className="copied-toast">
                    ✅ Copied to clipboard!
                  </div>
                )}

                <div className="result-actions">
                  <a
                    href={result.responderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    id="open-form-btn"
                  >
                    🔗 Open Form (Share this)
                  </a>
                  <a
                    href={result.editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    id="edit-form-btn"
                  >
                    ✏️ Edit in Google Forms
                  </a>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setResult(null);
                      setPrompt("");
                    }}
                    id="new-form-btn"
                  >
                    ➕ New Form
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Sign In Prompt */
          <div className="signin-section">
            <div className="signin-card" id="signin-card">
              <div className="signin-icon">🔐</div>
              <h2>Sign in to get started</h2>
              <p>
                Connect your Google account so your generated forms go directly
                into your Google Drive.
              </p>
              <button
                className="btn btn-google btn-lg"
                onClick={() => signIn("google")}
                id="signin-google-btn"
                disabled={status === "loading"}
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                We request access to Google Forms & Drive only. Your data stays
                yours.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="footer">
        FormAI · Powered by Groq &amp; Google Forms API · Built for educators &amp; students · Free
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
