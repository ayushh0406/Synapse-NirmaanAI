import { FC, useState, useEffect } from 'react';
import { Sandpack, SandpackFiles } from '@codesandbox/sandpack-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Smartphone, Tablet, Monitor, Loader2 } from 'lucide-react';
import { exportProject } from '@/lib/api';
import { saveAs } from 'file-saver';

export const PreviewPane: FC = () => {
  const { generatedFiles } = useStore();
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isExporting, setIsExporting] = useState(false);
  const [sandpackError, setSandpackError] = useState<string | null>(null);
  const [sandpackFiles, setSandpackFiles] = useState<SandpackFiles>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Process files whenever generatedFiles changes
  useEffect(() => {
    if (!generatedFiles || generatedFiles.length === 0) {
      setSandpackFiles(DEFAULT_FILES);
      return;
    }

    setIsProcessing(true);
    setSandpackError(null);
    
    try {
      console.log("Processing", generatedFiles.length, "files for preview");
      
      // Initial file mapping
      const files: SandpackFiles = {};
      
      // First pass: Process all files
      generatedFiles.forEach(file => {
        const path = file.path.startsWith('/') ? file.path.substring(1) : file.path;
        files[path] = {
          code: file.content,
          active: false
        };
      });
      
      // Ensure required files exist
      ensureRequiredFiles(files);
      
      // Set active file
      const appFile = findAppFile(files);
      if (appFile && files[appFile]) {
        files[appFile].active = true;
      }
      
      console.log("Processed files for Sandpack:", Object.keys(files));
      setSandpackFiles(files);
    } catch (err) {
      console.error("Error processing files for preview:", err);
      setSandpackError(`Error preparing preview: ${err.message}`);
      setSandpackFiles(DEFAULT_FILES);
    } finally {
      setIsProcessing(false);
    }
  }, [generatedFiles]);
  
  // Find the main App file
  const findAppFile = (files: SandpackFiles): string | null => {
    const candidates = [
      'src/App.jsx',
      'src/App.tsx',
      'src/App.js',
      'src/App.ts'
    ];
    
    for (const candidate of candidates) {
      if (files[candidate]) {
        return candidate;
      }
    }
    
    // If no App file found, look for any component
    return Object.keys(files).find(path => 
      path.includes('src/') && 
      (path.endsWith('.jsx') || path.endsWith('.tsx') || path.endsWith('.js'))
    ) || null;
  };
  
  // Ensure all required files exist
  const ensureRequiredFiles = (files: SandpackFiles) => {
    // Ensure index.html exists
    if (!files['index.html'] && !files['public/index.html']) {
      files['index.html'] = {
        code: DEFAULT_FILES['index.html'].code,
        hidden: true
      };
    }
    
    // Ensure entry point exists
    const hasEntryPoint = Object.keys(files).some(path => 
      path === 'src/index.js' || 
      path === 'src/index.jsx' || 
      path === 'src/index.tsx' ||
      path === 'src/main.jsx' ||
      path === 'src/main.tsx'
    );
    
    if (!hasEntryPoint) {
      files['src/index.jsx'] = {
        code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        hidden: true
      };
    }
    
    // Ensure CSS exists
    const hasCss = Object.keys(files).some(path => 
      path.endsWith('.css')
    );
    
    if (!hasCss) {
      files['src/index.css'] = {
        code: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 0;
}`,
        hidden: true
      };
    }
    
    // Add tailwind config if missing
    if (!files['tailwind.config.js']) {
      files['tailwind.config.js'] = {
        code: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
        hidden: true
      };
    }
    
    // Add postcss config if missing
    if (!files['postcss.config.js']) {
      files['postcss.config.js'] = {
        code: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
        hidden: true
      };
    }
  };

  const downloadCode = async () => {
    if (!generatedFiles.length) return;

    setIsExporting(true);
    try {
      const blob = await exportProject(generatedFiles);
      saveAs(blob, 'synapse-ui-project.zip');
    } catch (error) {
      console.error('Error exporting project:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getViewportClassName = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'max-w-[375px] mx-auto h-full';
      case 'tablet':
        return 'max-w-[768px] mx-auto h-full';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };
  
  // Reset preview
  const resetPreview = () => {
    if (!generatedFiles.length) return;
    
    setIsProcessing(true);
    setSandpackError(null);
    
    // Re-process files
    try {
      const files: SandpackFiles = {};
      
      generatedFiles.forEach(file => {
        const path = file.path.startsWith('/') ? file.path.substring(1) : file.path;
        files[path] = {
          code: file.content,
          active: false
        };
      });
      
      ensureRequiredFiles(files);
      const appFile = findAppFile(files);
      if (appFile) {
        files[appFile].active = true;
      }
      
      setSandpackFiles(files);
    } catch (err) {
      setSandpackError(`Error resetting preview: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-2 border-b border-border">
        <div className="text-lg font-semibold">Preview</div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewportSize === 'mobile' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewportSize('mobile')}
          >
            <Smartphone size={16} />
          </Button>
          <Button 
            variant={viewportSize === 'tablet' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewportSize('tablet')}
          >
            <Tablet size={16} />
          </Button>
          <Button 
            variant={viewportSize === 'desktop' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewportSize('desktop')}
          >
            <Monitor size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={resetPreview}
            disabled={isProcessing || !generatedFiles.length}
          >
            <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={downloadCode} 
            disabled={isExporting || !generatedFiles.length}
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </Button>
        </div>
      </div>
      
      <div className={`flex-1 overflow-hidden ${getViewportClassName()}`}>
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-muted-foreground">Preparing preview...</p>
          </div>
        ) : generatedFiles.length > 0 ? (
          <>
            {sandpackError && (
              <div className="p-4 mb-2 bg-destructive/10 text-destructive text-sm">
                {sandpackError}
              </div>
            )}
            <div className="h-full w-full">
              <Sandpack
                template="vite-react"
                files={sandpackFiles}
                theme="dark"
                options={{
                  showNavigator: false,
                  showLineNumbers: false,
                  showInlineErrors: true,
                  editorHeight: 0,
                  editorWidthPercentage: 0,
                  recompileMode: "immediate",
                  recompileDelay: 300
                }}
                customSetup={{
                  dependencies: {
                    "tailwindcss": "^3.3.0",
                    "@heroicons/react": "^2.0.18",
                    "framer-motion": "^10.12.0",
                    "clsx": "^2.0.0"
                  },
                  devDependencies: {
                    "autoprefixer": "^10.4.14",
                    "postcss": "^8.4.24"
                  }
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Enter a prompt to generate UI</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Default files to use when no files are generated
const DEFAULT_FILES = {
  'src/index.jsx': {
    code: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    hidden: true,
  },
  'src/App.jsx': {
    code: `import React from "react";

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Generate a UI to see the preview
        </h1>
        <p className="text-gray-600 text-center">
          Enter a prompt in the chat panel to generate a beautiful UI
        </p>
      </div>
    </div>
  );
}`,
    hidden: false,
  },
  'src/index.css': {
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 0;
}`,
    hidden: true,
  },
  'index.html': {
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    hidden: true,
  },
  'tailwind.config.js': {
    code: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    hidden: true,
  },
  'postcss.config.js': {
    code: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    hidden: true,
  }
};