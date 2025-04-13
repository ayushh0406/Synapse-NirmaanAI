import { FC, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  file: { path: string; content: string; language: string } | null;
}

export const CodeEditor: FC<CodeEditorProps> = ({ file }) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Determine language from file extension
  const getLanguage = () => {
    if (!file) return 'javascript';
    
    const extension = file.path.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      default:
        return 'javascript';
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      {file ? (
        <>
          <div className="bg-muted p-2 border-b border-border">
            <p className="text-sm font-mono">{file.path}</p>
          </div>
          <Editor
            height="calc(100% - 36px)"
            defaultLanguage={getLanguage()}
            value={file.content}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              padding: { top: 10 }
            }}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Select a file to edit</p>
        </div>
      )}
    </div>
  );
};
