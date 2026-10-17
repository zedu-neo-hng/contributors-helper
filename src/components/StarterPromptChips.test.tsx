import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StarterPromptChips from './StarterPromptChips';

const TEST_PROMPTS = [
  'How do I set up the project locally?',
  'Find good first issues for contributors',
  'What are the PR & commit conventions?',
  'Where are the Figma design guidelines?',
  'What deliverables are open and how do I submit my work?',
];

test('StarterPromptChips renders all prompt chips with proper accessibility attributes', () => {
  let selected = '';
  const html = renderToStaticMarkup(
    React.createElement(StarterPromptChips, {
      prompts: TEST_PROMPTS,
      onSelectPrompt: (p: string) => {
        selected = p;
      },
      disabled: false,
    })
  );

  // Group container and heading
  assert.ok(html.includes('role="group"'), 'Should have role="group"');
  assert.ok(html.includes('aria-label="Starter prompt suggestions"'), 'Should have accessible group label');
  assert.ok(html.includes('Suggested questions to get started:'), 'Should render heading label');

  // Verify each prompt is rendered as a button with aria-label
  for (const prompt of TEST_PROMPTS) {
    const escaped = prompt.replace(/&/g, '&amp;');
    assert.ok(html.includes(escaped), `Should render prompt text: ${prompt}`);
    assert.ok(html.includes(`aria-label="Ask Zoe: ${escaped}"`), `Should include aria-label for prompt: ${prompt}`);
  }
});

test('StarterPromptChips handles disabled state when chat is loading', () => {
  const html = renderToStaticMarkup(
    React.createElement(StarterPromptChips, {
      prompts: TEST_PROMPTS,
      onSelectPrompt: () => {},
      disabled: true,
    })
  );

  assert.ok(html.includes('disabled=""') || html.includes('disabled'), 'Buttons should have disabled attribute when disabled=true');
});

