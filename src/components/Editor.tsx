import React from 'react';
import { CodeBlock, atomOneDark } from 'react-code-blocks';

interface EditorProps {
  value: string;
  language: string;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ value, language, readOnly = false }) => {
  return (
    <div className="w-full h-full overflow-auto bg-zinc-900 rounded-md">
      <CodeBlock
        text={value}
        language={language}
        theme={atomOneDark}
        showLineNumbers={true}
        wrapLines={true}
      />
    </div>
  );
};