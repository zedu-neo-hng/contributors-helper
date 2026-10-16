"use client";
import { useState, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { signIn, signOut, useSession } from "next-auth/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";
  const [authError, setAuthError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to Zoe, The Official Zedu Contributor Assistant! Ask me about tasks.",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = "";
    try {
      id = localStorage.getItem("zoe-session-id") || "";
    } catch {}
    if (!id) {
      id = crypto.randomUUID();
      try {
        localStorage.setItem("zoe-session-id", id);
      } catch {}
    }
    setSessionId(id);
    fetch(`/api/chat/history?sessionId=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, sessionId }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Failed to connect to the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);

    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setAuthError("Unable to start Google sign-in. Please try again.");
    }
  };

  const handleSignOut = async () => {
    if (!authenticated) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Your session has expired or you are signed out. Please sign in with Google to continue.",
        },
      ]);
      return;
    }

    setAuthError(null);

    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      setAuthError("Unable to sign out. Please try again.");
    }
  };

  return (
    <main
      style={{
        backgroundColor: "#0d1117",
        color: "#f0f6fc",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "750px",
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          height: "85vh",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "#1f1a3a",
            borderBottom: "1px solid #30363d",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>
            Zedu Contributor Assistant
          </h2>

          <span
            style={{
              background: "#7c3aed",
              color: "#fff",
              fontSize: "0.75rem",
              padding: "4px 10px",
              borderRadius: "20px",
            }}
          >
            Groq Powered
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {status === "loading" ? (
              <span style={{ color: "#c9d1d9", fontSize: "0.8rem" }}>
                Checking session...
              </span>
            ) : authenticated ? (
              <>
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                )}

                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#fff", fontSize: "0.8rem" }}>
                    {session.user?.name || "Google user"}
                  </div>
                  <div style={{ color: "#c9d1d9", fontSize: "0.7rem" }}>
                    {session.user?.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => signOut()}
                  style={{
                    backgroundColor: "#7c3aed",
                    color: "#fff",
                    border: "none",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google")}
                style={{
                  backgroundColor: "#7c3aed",
                  color: "#fff",
                  border: "none",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        {/* Message Window */}
        <div
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: m.role === "user" ? "#7c3aed" : "#1f2937",
                color: "#f0f6fc",
                padding: "12px 16px",
                borderRadius: "8px",
                maxWidth: "85%",
                lineHeight: "1.5",
                fontSize: "0.95rem",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "0.8rem",
                  opacity: 0.8,
                }}
              >
                {m.role === "user" ? "You" : "Zedu AI"}
              </strong>

              {/* Markdown rendering for structured text, lists, and clickable links */}
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    a: ({  ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#58a6ff",
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                      />
                    ),
                    ul: ({  ...props }) => (
                      <ul
                        {...props}
                        style={{ paddingLeft: "20px", margin: "8px 0" }}
                      />
                    ),
                    ol: ({  ...props }) => (
                      <ol
                        {...props}
                        style={{ paddingLeft: "20px", margin: "8px 0" }}
                      />
                    ),
                    li: ({  ...props }) => (
                      <li {...props} style={{ marginBottom: "4px" }} />
                    ),
                    p: ({  ...props }) => (
                      <p {...props} style={{ margin: "6px 0" }} />
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div
              style={{
                color: "#8b949e",
                fontSize: "0.85rem",
                fontStyle: "italic",
              }}
            >
              Zedu AI is reviewing tabs and formatting...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "16px",
            borderTop: "1px solid #30363d",
            display: "flex",
            gap: "10px",
            background: "#161b22",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about tasks, submission links, or slide decks..."
            style={{
              flex: 1,
              backgroundColor: "#0d1117",
              border: "1px solid #30363d",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "6px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#7c3aed",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
