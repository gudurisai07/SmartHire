function readGroup(source, openingIndex, opening = '{', closing = '}') {
  if (source[openingIndex] !== opening) return null;
  let depth = 0;
  let escaped = false;

  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    if (character === '\\') {
      escaped = !escaped;
      continue;
    }
    if (!escaped && character === opening) depth += 1;
    if (!escaped && character === closing) {
      depth -= 1;
      if (depth === 0) return { value: source.slice(openingIndex + 1, index), end: index + 1 };
    }
    escaped = false;
  }

  return null;
}

function replaceCommand(source, command, argumentCount, replacement, allowOptional = false) {
  const expression = new RegExp(`\\\\${command}\\*?(?![A-Za-z@])`, 'g');
  let result = '';
  let copiedThrough = 0;
  let match;

  while ((match = expression.exec(source)) !== null) {
    let argumentIndex = match.index + match[0].length;
    while (/\s/.test(source[argumentIndex] || '') && argumentIndex < source.length) argumentIndex += 1;

    if (allowOptional && source[argumentIndex] === '[') {
      const optionalArgument = readGroup(source, argumentIndex, '[', ']');
      if (optionalArgument) argumentIndex = optionalArgument.end;
    }

    const argumentsList = [];
    let end = argumentIndex;
    let valid = true;
    for (let index = 0; index < argumentCount; index += 1) {
      while (/\s/.test(source[end] || '') && end < source.length) end += 1;
      const argument = readGroup(source, end);
      if (!argument) {
        valid = false;
        break;
      }
      argumentsList.push(argument.value);
      end = argument.end;
    }

    if (!valid) continue;
    result += source.slice(copiedThrough, match.index) + replacement(argumentsList);
    copiedThrough = end;
    expression.lastIndex = end;
  }

  return result + source.slice(copiedThrough);
}

function removeLatexComments(source) {
  return source.split('\n').map((line) => {
    let precedingBackslashes = 0;
    for (let index = 0; index < line.length; index += 1) {
      if (line[index] === '%' && precedingBackslashes % 2 === 0) return line.slice(0, index);
      precedingBackslashes = line[index] === '\\' ? precedingBackslashes + 1 : 0;
    }
    return line;
  }).join('\n');
}

export function parseLatexResume(source) {
  let content = removeLatexComments(String(source || '').replace(/\r\n?/g, '\n'));
  const documentStart = content.indexOf('\\begin{document}');
  if (documentStart >= 0) content = content.slice(documentStart + '\\begin{document}'.length);
  const documentEnd = content.indexOf('\\end{document}');
  if (documentEnd >= 0) content = content.slice(0, documentEnd);

  content = replaceCommand(content, 'section', 1, ([title]) => `\n[[H1]]${title}[[/H1]]\n`, true);
  content = replaceCommand(content, 'subsection', 1, ([title]) => `\n[[H2]]${title}[[/H2]]\n`, true);
  content = replaceCommand(content, 'href', 2, ([url, label]) => label || url);
  content = replaceCommand(content, 'url', 1, ([url]) => url);
  for (const command of ['textbf', 'textit', 'emph', 'underline', 'textrm', 'textsf', 'texttt']) {
    content = replaceCommand(content, command, 1, ([text]) => text);
  }
  for (const command of ['vspace', 'hspace']) {
    content = replaceCommand(content, command, 1, () => '', true);
  }

  content = content
    .replace(/\\item(?:\s*\[[^\]]*\])?/g, '\n[[BULLET]] ')
    .replace(/\\begin\{tabular\*?\}\s*\{[^{}]*\}|\\end\{tabular\*?\}/g, '\n')
    .replace(/\\(?:begin|end)\s*\{[^{}]*\}/g, '\n')
    .replace(/\\\\(?:\[[^\]]*\])?/g, '\n')
    .replace(/\\(?:newline|linebreak|par)\b/g, '\n')
    .replace(/\\(?:centering|raggedright|raggedleft|noindent|hfill|vfill|small|large|Large|LARGE|huge|Huge|bfseries|itshape|scshape|maketitle|newpage|clearpage)\b/g, ' ')
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\([%&_#$])/g, '$1')
    .replace(/\\~/g, ' ')
    .replace(/\\-/g, '')
    .replace(/\\[A-Za-z@]+\*?/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/&/g, ' · ');

  return content.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).map((line) => {
    const heading = line.match(/^\[\[H([12])\]\](.*?)\[\[\/H[12]\]\]$/);
    if (heading) return { type: 'heading', level: Number(heading[1]), text: heading[2].trim() };
    if (line.startsWith('[[BULLET]]')) return { type: 'bullet', text: line.slice('[[BULLET]]'.length).trim() };
    return { type: 'paragraph', text: line };
  });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function printResumePdf(source) {
  const blocks = parseLatexResume(source);
  if (!blocks.length) throw new Error('No resume content was found to export.');

  const body = blocks.map((block, index) => {
    const text = escapeHtml(block.text);
    if (block.type === 'heading') return block.level === 1 ? `<h2>${text}</h2>` : `<h3>${text}</h3>`;
    if (block.type === 'bullet') return `<p class="bullet">${text}</p>`;
    return index === 0 ? `<h1>${text}</h1>` : `<p>${text}</p>`;
  }).join('\n');
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Your browser blocked the PDF window. Allow pop-ups and try again.');
  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Resume</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { color: #172033; font: 11pt/1.5 Arial, sans-serif; }
          h1 { margin: 0 0 16pt; font-size: 21pt; text-align: center; }
          h2 { margin: 16pt 0 5pt; border-bottom: 1px solid #9aa8bb; padding-bottom: 3pt; font-size: 13pt; }
          h3 { margin: 10pt 0 4pt; font-size: 11pt; }
          p { margin: 3pt 0; }
          .bullet { margin-left: 14pt; text-indent: -10pt; }
          @media screen { body { max-width: 760px; margin: 36px auto; } }
        </style>
      </head>
      <body>${body}</body>
    </html>`);
  printWindow.document.close();
  window.setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.focus();
      printWindow.print();
    }
  }, 250);
}

export async function createResumeDocx(source) {
  const blocks = parseLatexResume(source);
  if (!blocks.length) throw new Error('No resume content was found to export.');
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');

  const children = blocks.map((block, index) => {
    if (block.type === 'heading') {
      return new Paragraph({
        text: block.text,
        heading: block.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
      });
    }
    if (block.type === 'bullet') return new Paragraph({ text: `• ${block.text}`, spacing: { after: 80 } });
    if (index === 0) {
      return new Paragraph({
        children: [new TextRun({ text: block.text, bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      });
    }
    return new Paragraph({ text: block.text, spacing: { after: 80 } });
  });

  const document = new Document({
    title: 'Resume',
    sections: [{
      properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
      children,
    }],
  });
  return Packer.toBlob(document);
}
