import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const renderInline = (text: string): React.ReactNode[] => {
    // Parse bold (**text**), code (`text`), and italic (*text*)
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const raw = match[0];
      if (raw.startsWith('**') && raw.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-slate-900">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith('`') && raw.endsWith('`')) {
        parts.push(
          <code key={match.index} className="font-mono text-[11px] bg-slate-100 text-primary-700 px-1.5 py-0.5 rounded border border-slate-200">
            {raw.slice(1, -1)}
          </code>
        );
      } else if (raw.startsWith('*') && raw.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-slate-700">
            {raw.slice(1, -1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const flushList = (key: number) => {
    if (!currentList) return null;
    const ListTag = currentList.type;
    const items = currentList.items.map((item, idx) => (
      <li key={idx} className="leading-relaxed">
        {renderInline(item)}
      </li>
    ));
    const listEl = (
      <ListTag
        key={`list-${key}`}
        className={`my-1.5 space-y-1 pl-5 text-slate-700 ${
          currentList.type === 'ul' ? 'list-disc' : 'list-decimal'
        }`}
      >
        {items}
      </ListTag>
    );
    currentList = null;
    return listEl;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check for empty line
    if (!trimmed) {
      if (currentList) {
        elements.push(flushList(idx));
      }
      return;
    }

    // Unordered list: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.substring(2);
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) elements.push(flushList(idx));
        currentList = { type: 'ul', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Ordered list: 1. 2.
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const itemText = orderedMatch[2];
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) elements.push(flushList(idx));
        currentList = { type: 'ol', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // If we were inside a list and hit non-list line, flush
    if (currentList) {
      elements.push(flushList(idx));
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-sm font-bold text-slate-900 mt-3 mb-1 flex items-center space-x-1.5">
          <span>{trimmed.substring(4)}</span>
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-base font-bold text-slate-900 mt-3.5 mb-1.5">
          {trimmed.substring(3)}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-lg font-extrabold text-slate-900 mt-3 mb-2 border-b border-slate-200 pb-1">
          {trimmed.substring(2)}
        </h1>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={idx}
          className="border-l-4 border-primary-500 bg-primary-50/60 pl-3 py-1.5 my-2 text-xs italic text-slate-700 rounded-r"
        >
          {renderInline(trimmed.substring(2))}
        </blockquote>
      );
      return;
    }

    // Standard paragraph line
    elements.push(
      <p key={idx} className="my-1 leading-relaxed text-slate-700">
        {renderInline(trimmed)}
      </p>
    );
  });

  if (currentList) {
    elements.push(flushList(lines.length));
  }

  return <div className={`text-xs space-y-1 ${className}`}>{elements}</div>;
};

