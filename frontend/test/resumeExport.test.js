import assert from 'node:assert/strict';
import test from 'node:test';
import { createResumeDocx, parseLatexResume, printResumePdf } from '../src/resumeExport.js';

const sampleLatex = String.raw`\documentclass{article}
\begin{document}
Jordan Rivera\\
\section*{Experience}
\textbf{Software Engineer} at Example Co.
\begin{itemize}
\item Built a secure hiring dashboard.
\end{itemize}
\end{document}`;

test('parses resume sections and bullets from generated LaTeX', () => {
  assert.deepEqual(parseLatexResume(sampleLatex), [
    { type: 'paragraph', text: 'Jordan Rivera' },
    { type: 'heading', level: 1, text: 'Experience' },
    { type: 'paragraph', text: 'Software Engineer at Example Co.' },
    { type: 'bullet', text: 'Built a secure hiring dashboard.' },
  ]);
});

test('creates a downloadable DOCX archive from resume content', async () => {
  const blob = await createResumeDocx(sampleLatex);
  const bytes = new Uint8Array(await blob.arrayBuffer());

  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});

test('prepares a local printable resume document for PDF export', () => {
  let html = '';
  let printed = false;
  const printWindow = {
    document: { open() {}, write(content) { html = content; }, close() {} },
    focus() {},
    print() { printed = true; },
    closed: false,
  };
  const originalWindow = globalThis.window;
  globalThis.window = { open: () => printWindow, setTimeout: (callback) => callback() };

  try {
    printResumePdf(sampleLatex);
    assert.match(html, /<h1>Jordan Rivera<\/h1>/);
    assert.match(html, /<h2>Experience<\/h2>/);
    assert.match(html, /Built a secure hiring dashboard\./);
    assert.equal(printed, true);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
