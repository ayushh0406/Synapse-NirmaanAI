import React, { useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom/client';

interface PreviewPaneProps {
  code: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);

  useEffect(() => {
    // Cleanup previous render
    if (containerRef.current && rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }

    if (!code || !containerRef.current) return;

    try {
      // Create a new root for rendering
      const root = ReactDOM.createRoot(containerRef.current);
      rootRef.current = root;
      
      // Transform the string code into a component
      const transformCode = new Function('React', `
        try {
          ${code}
          return React.createElement(ProductCard);
        } catch (error) {
          return React.createElement('div', {
            className: 'p-4 bg-red-50 border border-red-300 rounded-md text-red-700'
          }, 'Error rendering preview: ' + error.message);
        }
      `);

      // Render the component
      const element = transformCode(React);
      root.render(element);
    } catch (error) {
      if (containerRef.current && rootRef.current) {
        rootRef.current.render(
          <div className="p-4 bg-red-50 border border-red-300 rounded-md text-red-700">
            Error rendering preview: {(error as Error).message}
          </div>
        );
      }
    }

    return () => {
      // Cleanup on unmount
      if (rootRef.current) {
        rootRef.current.unmount();
      }
    };
  }, [code]);

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center border rounded-md bg-muted">
        <p className="text-muted-foreground">
          Generate a product card to see the preview here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto border rounded-md p-4 bg-white">
      <div ref={containerRef} className="flex justify-center"></div>
    </div>
  );
};