'use client';
import { useState, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to Zoe, The Official Zedu Contributor Assistant! Ask me about tasks.' }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedbackOpenIndex, setFeedbackOpenIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackSubmittedIndex, setFeedbackSubmittedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
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
        setMessages([...updatedMessages, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Failed to connect to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ backgroundColor: '#0d1117', color: '#f0f6fc', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '750px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '85vh', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', background: '#1f1a3a', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Zedu Contributor Assistant</h2>
          <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px' }}>Groq Powered</span>
        </div>

        {/* Message Window */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ 
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: m.role === 'user' ? '#7c3aed' : '#1f2937',
              color: '#f0f6fc', padding: '12px 16px', borderRadius: '8px', maxWidth: '85%', lineHeight: '1.5', fontSize: '0.95rem',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', opacity: 0.8 }}>
                {m.role === 'user' ? 'You' : 'Zedu AI'}
              </strong>
              {/* Markdown rendering for structured text, lists, and clickable links */}
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff', textDecoration: 'underline', fontWeight: 500 }} />
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
              {m.role === 'assistant' && (
                <div className="message-feedback">
                  {feedbackSubmittedIndex === idx ? (
                    <p className="feedback-notice" role="status">Feedback isn’t sent or saved.</p>
                  ) : feedbackOpenIndex === idx ? (
                    <form
                      className="feedback-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setFeedbackSubmittedIndex(idx);
                        setFeedbackOpenIndex(null);
                        setFeedback('');
                      }}
                    >
                      <label htmlFor={`feedback-${idx}`}>What could be better? (optional)</label>
                      <textarea
                        id={`feedback-${idx}`}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        maxLength={250}
                        rows={3}
                      />
                      <div className="feedback-form-footer">
                        <span aria-live="polite">{feedback.length}/250 characters</span>
                        <div>
                          <button type="button" className="feedback-cancel" onClick={() => { setFeedbackOpenIndex(null); setFeedback(''); }}>Cancel</button>
                          <button type="submit" className="feedback-submit">Submit</button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="downvote-button"
                      aria-expanded={false}
                      onClick={() => { setFeedbackOpenIndex(idx); setFeedback(''); }}
                    >
                      ↓ Not helpful
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && <div style={{ color: '#8b949e', fontSize: '0.85rem', fontStyle: 'italic' }}>Zedu AI is reviewing tabs and formatting...</div>}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid #30363d', display: 'flex', gap: '10px', background: '#161b22' }}>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask about tasks, submission links, or slide decks..." 
            style={{ flex: 1, backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#fff', padding: '10px 14px', borderRadius: '6px', outline: 'none' }}
          />
          <button type="submit" style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
        </form>

      </div>
    </main>
  );
}
