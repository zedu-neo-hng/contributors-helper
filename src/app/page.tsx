"use client";

import { FormEvent, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply ?? data.error ?? "Something went wrong." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Contributors Helper</h1>
      <p>Ask a question about anything discussed in our team calls.</p>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.text}</div>
        ))}
        {loading && <div className="bubble assistant">Thinking…</div>}
      </div>
      <form onSubmit={send} className="composer">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </main>
  );
}
