import React, { useRef, useCallback, type ChangeEvent } from 'react';
import { cn } from '../utils/cn';

export type CodeLanguage = 'yaml' | 'json' | 'text';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeLanguage;
  readOnly?: boolean;
  placeholder?: string;
  /** Minimum visible lines */
  minLines?: number;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'text',
  readOnly = false,
  placeholder,
  minLines = 8,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, minLines);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (readOnly) return;
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange?.(newValue);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange, readOnly]
  );

  return (
    <div
      className={cn(
        'flex border border-surface-border bg-slate-900 rounded-none overflow-hidden font-mono text-sm',
        className
      )}
    >
      {/* Line numbers gutter */}
      <div
        className="flex-shrink-0 select-none text-right pr-3 pl-3 py-3 text-slate-500 bg-slate-950 border-r border-slate-700 leading-relaxed"
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1}>{i + 1}</div>
        ))}
      </div>

      {/* Editor area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        data-language={language}
        className={cn(
          'flex-1 bg-transparent text-slate-100 p-3 leading-relaxed resize-none',
          'focus:outline-none placeholder:text-slate-600',
          'rounded-none',
          readOnly && 'cursor-default'
        )}
        style={{
          minHeight: `${lineCount * 1.65}em`,
          tabSize: 2,
        }}
      />
    </div>
  );
};

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
