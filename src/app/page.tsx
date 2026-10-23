
'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { messagePlainText } from '../lib/messagePlainText';
import styles from './chat.module.css';
import IngestPanel from '@/components/IngestPanel';
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
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const requestInFlight = useRef(false);
  const composing = useRef(false);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep the newest message (or the loading indicator) in view.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const [copyFeedback, setCopyFeedback] = useState<{ index: number; state: 'pending' | 'success' | 'error' } | null>(null);
  const messageElements = useRef(new Map<number, HTMLDivElement>());
  const copyRequest = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();
  const typewriterRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => {
    copyRequest.current++;
    clearTimeout(copyTimer.current);
    if (typewriterRef.current) clearInterval(typewriterRef.current);
  }, []);

  const copyMessage = async (index: number) => {
    const request = ++copyRequest.current;
    clearTimeout(copyTimer.current);
    setCopyFeedback({ index, state: 'pending' });
    try {
      const element = messageElements.current.get(index);
      if (!element || !navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(messagePlainText(element));
      if (request !== copyRequest.current) return;
      setCopyFeedback({ index, state: 'success' });
      copyTimer.current = setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      if (request === copyRequest.current) setCopyFeedback({ index, state: 'error' });
    }
  };

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = "auto";
    composer.style.height = `${Math.min(composer.scrollHeight + 2, 160)}px`;
  }, [input]);

  useEffect(() => {
    let id = "";

    try {
      id = localStorage.getItem("zoe-session-id") || "";
    } catch {
      // Local storage may be unavailable.
    }

    if (!id) {
      id = crypto.randomUUID();

      try {
        localStorage.setItem("zoe-session-id", id);
      } catch {
        // Chat can still work without local storage.
      }
    }

    setSessionId(id);
  }, []);


  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    fetch('/api/chat/history')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && Array.isArray(data?.messages) && data.messages.length > 0) {
          copyRequest.current++;
          clearTimeout(copyTimer.current);
          setCopyFeedback(null);
          setMessages(data.messages);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [authenticated]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const question = input.trim();
    if (!question || requestInFlight.current) return;
    requestInFlight.current = true;

    const userMessage: Message = {
      role: "user",
      content: question,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (!res.ok || contentType.includes("application/json")) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Chat request failed (${res.status})`);
      }

      if (!res.body) {
        throw new Error("The chat API returned an invalid response.");
      }

      // The reply arrives as SSE events ({ delta } chunks, { error } on failure).
      // Received text is revealed gradually by a typewriter interval so it reads
      // as typing; ReactMarkdown renders the revealed text on every tick.
      setStreaming(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let revealed = 0;

      const showTyped = (content: string) => {
        setMessages((current) => {
          const last = current[current.length - 1];

          if (last?.role === "assistant") {
            const next = [...current];
            next[next.length - 1] = { role: "assistant", content };
            return next;
          }

          return [...current, { role: "assistant", content }];
        });
        setLoading(false);
      };

      const typewriter = setInterval(() => {
        if (revealed >= full.length) return;

        revealed += Math.max(1, Math.ceil((full.length - revealed) / 20));
        showTyped(full.slice(0, revealed));
      }, 16);
      typewriterRef.current = typewriter;

      const applyEvent = (event: string) => {
        const dataLine = event
          .split("\n")
          .find((line) => line.startsWith("data: "));

        if (!dataLine) return;

        const payload = JSON.parse(dataLine.slice("data: ".length)) as {
          delta?: string;
          error?: string;
        };

        if (payload.error) throw new Error(payload.error);

        if (typeof payload.delta === "string") full += payload.delta;
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) applyEvent(part);
      }

      clearInterval(typewriter);
      typewriterRef.current = undefined;
      showTyped(full || "No response.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to connect to the server.";

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: `Error: ${message}`,
        },
      ]);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setStreaming(false);
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
        flexDirection: "column",
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
            OpenRouter Powered
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
                  onClick={handleSignOut}
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
                onClick={handleSignIn}
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

          {authError && (
            <p
              role="alert"
              style={{
                color: "#f85149",
                fontSize: "0.8rem",
                margin: 0,
                width: "100%",
              }}
            >
              {authError}
            </p>
          )}
        </div>

        {/* Message Window */}

        <div
          style={{
            flex: 1,
            minHeight: 0,
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
              className={styles.message}
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
                {m.role === "user" ? "You" : "Zoe"}
              </strong>

              {/* Markdown rendering for structured text, lists, and clickable links */}
              <div className="markdown-content" ref={(element) => {
                if (element) messageElements.current.set(idx, element);
                else messageElements.current.delete(idx);
              }} style={{
                whiteSpace: m.role === "user" ? "pre-wrap" : undefined,
              }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ ...props }) => (
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
                    ul: ({ ...props }) => (
                      <ul
                        {...props}
                        style={{ paddingLeft: "20px", margin: "8px 0" }}
                      />
                    ),
                    ol: ({ ...props }) => (
                      <ol
                        {...props}
                        style={{ paddingLeft: "20px", margin: "8px 0" }}
                      />
                    ),
                    li: ({ ...props }) => (
                      <li {...props} style={{ marginBottom: "4px" }} />
                    ),
                    p: ({ ...props }) => (
                      <p {...props} style={{ margin: "6px 0" }} />
                    ),
                    table: ({ ...props }) => (
                      <table
                        {...props}
                        style={{
                          borderCollapse: "collapse",
                          margin: "10px 0",
                          display: "block",
                          maxWidth: "100%",
                          overflowX: "auto",
                        }}
                      />
                    ),
                    th: ({ ...props }) => (
                      <th
                        {...props}
                        style={{
                          border: "1px solid #30363d",
                          background: "#21262d",
                          padding: "6px 10px",
                          textAlign: "left",
                        }}
                      />
                    ),
                    td: ({ ...props }) => (
                      <td
                        {...props}
                        style={{
                          border: "1px solid #30363d",
                          padding: "6px 10px",
                          textAlign: "left",
                        }}
                      />
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
              {m.role === 'assistant' && <>
                <button type="button" className={styles.copy}
                  aria-label={`Copy Zoe response ${idx + 1}`}
                  aria-describedby={`copy-status-${idx}`}
                  disabled={streaming && idx === messages.length - 1}
                  style={streaming && idx === messages.length - 1 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  onClick={() => void copyMessage(idx)}>
                  {copyFeedback?.index === idx && copyFeedback.state === 'success' ? 'Copied' : 'Copy'}
                </button>
                <div id={`copy-status-${idx}`} role="status" aria-live="polite" aria-atomic="true" className={styles.status}>
                  {copyFeedback?.index === idx && (
                    copyFeedback.state === 'success' ? 'Response copied to clipboard.' :
                    copyFeedback.state === 'error' ? 'Could not copy. Try again, or select and copy the response manually.' : 'Copying response…'
                  )}
                </div>
              </>}
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
              Zoe is thinking…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          aria-busy={loading}
          style={{
            padding: "16px",
            borderTop: "1px solid #30363d",
            display: "flex",
            flexShrink: 0,
            alignItems: "flex-start",
            gap: "10px",
            background: "#161b22",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea
              className={styles.composerInput}
              ref={composerRef}
              aria-label="Message Zoe"
              aria-describedby="composer-help"
              rows={1}
              value={input}
              readOnly={loading}
              onChange={(e) => setInput(e.target.value)}
              onCompositionStart={() => { composing.current = true; }}
              onCompositionEnd={() => { composing.current = false; }}
              onKeyDown={(e) => {
                if (
                  e.key !== "Enter" || e.shiftKey || composing.current ||
                  e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229
                ) return;
                e.preventDefault();
                if (!e.repeat) e.currentTarget.form?.requestSubmit();
              }}
              placeholder="Ask about tasks, submission links, or slide decks..."
              style={{
                display: "block",
                width: "100%",
                minHeight: "46px",
                maxHeight: "160px",
                resize: "none",
                overflowY: "auto",
                font: "inherit",
                lineHeight: 1.5,
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "6px",
              }}
            />
            <small id="composer-help" style={{ display: "block", marginTop: "6px", color: "#8b949e" }}>
              Enter to send · Shift+Enter for a new line
            </small>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              backgroundColor: "#7c3aed",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: "bold",
              flexShrink: 0,
              minHeight: "46px",
              opacity: loading || !input.trim() ? 0.6 : 1,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
      <IngestPanel />
    </main>
  );
}
