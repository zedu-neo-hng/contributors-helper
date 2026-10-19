'use client';
import { useState, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feedbackEnabled?: boolean;
  rating?: 'up' | 'down';
  feedbackSaved?: boolean;
  commentOpen?: boolean;
  commentDraft?: string;
  feedbackError?: string;
}

export function ChatInterface({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Welcome to Zoe, The Official Zedu Contributor Assistant! Ask me about tasks.' }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();

      if (data.error) {
        setMessages([...updatedMessages, { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages([...updatedMessages, { id: crypto.randomUUID(), role: 'assistant', content: data.reply, feedbackEnabled: true }]);
      }
    } catch (err) {
      setMessages([...updatedMessages, { id: crypto.randomUUID(), role: 'assistant', content: 'Failed to connect to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (messageId: string, rating: 'up' | 'down', comment = '') => {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, feedbackError: undefined } : message));
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: messageId, rating, comment }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Feedback could not be saved.');
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, rating, feedbackSaved: true, feedbackError: undefined } : message));
    } catch (error) {
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, feedbackError: error instanceof Error ? error.message : 'Feedback could not be saved.' } : message));
    }
  };

  return (
    <main id="chat" className={embedded ? 'admin-chat-embed' : undefined} style={{ backgroundColor: embedded ? '#f5f6f8' : '#0d1117', color: embedded ? '#202531' : '#f0f6fc', minHeight: embedded ? '100%' : '100vh', height: embedded ? '100%' : undefined, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: embedded ? '14px' : '20px', fontFamily: 'sans-serif' }}>
      {!embedded && <a className="admin-shortcut" href="/admin/feedback">Admin analytics</a>}
      <div className={embedded ? 'admin-chat-card' : undefined} style={{ width: '100%', maxWidth: '750px', backgroundColor: embedded ? '#fff' : '#161b22', border: `1px solid ${embedded ? '#e7e9ed' : '#30363d'}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', height: embedded ? 'min(100%, 760px)' : '85vh', boxShadow: embedded ? '0 1px 3px rgba(32,37,49,0.08)' : '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

        {/* Header */}
        <div className={embedded ? 'admin-chat-toolbar' : undefined} style={{ padding: '16px 20px', background: embedded ? '#fff' : '#1f1a3a', borderBottom: `1px solid ${embedded ? '#e9ebef' : '#30363d'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Zedu Contributor Assistant</h2>
          <span style={{ background: embedded ? '#f0efff' : '#7c3aed', color: embedded ? '#6257d7' : '#fff', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px' }}>Groq Powered</span>
        </div>

        {/* Message Window */}
        <div className={embedded ? 'admin-chat-transcript' : undefined} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m) => (
            <div key={m.id} className={embedded ? `admin-chat-message ${m.role}` : undefined} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: m.role === 'user' ? '#7c3aed' : (embedded ? '#f5f6f8' : '#1f2937'),
              color: m.role === 'user' || !embedded ? '#f0f6fc' : '#202531', padding: '12px 16px', borderRadius: '8px', maxWidth: '85%', lineHeight: '1.5', fontSize: '0.95rem',
              boxShadow: embedded ? '0 1px 2px rgba(32,37,49,0.06)' : '0 2px 5px rgba(0,0,0,0.2)'
            }}>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', opacity: 0.8 }}>
                {m.role === 'user' ? 'You' : 'Zedu AI'}
              </strong>
              {/* Markdown rendering for structured text, lists, and clickable links */}
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: embedded ? '#6257d7' : '#58a6ff', textDecoration: 'underline', fontWeight: 500 }} />
                    ),
                    ul: ({ node, ...props }) => <ul {...props} style={{ paddingLeft: '20px', margin: '8px 0' }} />,
                    ol: ({ node, ...props }) => <ol {...props} style={{ paddingLeft: '20px', margin: '8px 0' }} />,
                    li: ({ node, ...props }) => <li {...props} style={{ marginBottom: '4px' }} />,
                    p: ({ node, ...props }) => <p {...props} style={{ margin: '6px 0' }} />
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
                {m.role === 'assistant' && m.feedbackEnabled && <div className="response-feedback" aria-label="Rate this response">
                <span>Was this helpful?</span>
                <button type="button" className={m.rating === 'up' ? 'chosen' : ''} aria-label="Helpful" aria-pressed={m.rating === 'up'} onClick={() => { setMessages((current) => current.map((item) => item.id === m.id ? { ...item, rating: 'up', commentOpen: false } : item)); void submitFeedback(m.id, 'up'); }}>👍</button>
                <button type="button" className={m.rating === 'down' ? 'chosen' : ''} aria-label="Not helpful" aria-pressed={m.rating === 'down'} onClick={() => { setMessages((current) => current.map((item) => item.id === m.id ? { ...item, rating: 'down', commentOpen: true } : item)); void submitFeedback(m.id, 'down'); }}>👎</button>
                {m.feedbackSaved && <small>Thanks for your feedback</small>}
                {m.feedbackError && <small className="feedback-error" role="alert">{m.feedbackError}</small>}
                {m.commentOpen && <form className="feedback-comment" onSubmit={(event) => { event.preventDefault(); void submitFeedback(m.id, 'down', m.commentDraft || ''); }}>
                  <label htmlFor={`feedback-comment-${m.id}`}>What could be better? <span>(optional)</span></label>
                  <textarea id={`feedback-comment-${m.id}`} maxLength={500} value={m.commentDraft || ''} onChange={(event) => setMessages((current) => current.map((item) => item.id === m.id ? { ...item, commentDraft: event.target.value } : item))} placeholder="Add a short note…" rows={2} />
                  <button type="submit">Save comment</button>
                </form>}
              </div>}
            </div>
          ))}
          {loading && <div style={{ color: '#8b949e', fontSize: '0.85rem', fontStyle: 'italic' }}>Zedu AI is reviewing tabs and formatting...</div>}
        </div>

        {/* Input Form */}
        <form className={embedded ? 'admin-chat-composer' : undefined} onSubmit={handleSubmit} style={{ padding: '16px', borderTop: `1px solid ${embedded ? '#e9ebef' : '#30363d'}`, display: 'flex', gap: '10px', background: embedded ? '#fff' : '#161b22' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about tasks, submission links, or slide decks..."
            style={{ flex: 1, backgroundColor: embedded ? '#fff' : '#0d1117', border: `1px solid ${embedded ? '#dfe2e8' : '#30363d'}`, color: embedded ? '#202531' : '#fff', padding: '10px 14px', borderRadius: '6px', outline: 'none' }}
          />
          <button type="submit" style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
        </form>

      </div>
    </main>
  );
}
