'use client';
import React from 'react';

interface StarterPromptChipsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export default function StarterPromptChips({
  prompts,
  onSelectPrompt,
  disabled = false,
}: StarterPromptChipsProps) {
  return (
    <div
      className="starter-prompts-container"
      style={{
        alignSelf: 'flex-start',
        maxWidth: '100%',
        marginTop: '-4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <span
        style={{
          fontSize: '0.8rem',
          color: '#8b949e',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span aria-hidden="true">💡</span> Suggested questions to get started:
      </span>
      <div
        className="starter-prompts-chips"
        role="group"
        aria-label="Starter prompt suggestions"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            disabled={disabled}
            aria-label={`Ask Zoe: ${prompt}`}
            className="starter-prompt-chip"
          >
            <span style={{ marginRight: '6px', opacity: 0.8 }} aria-hidden="true">
              💬
            </span>
            <span>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

