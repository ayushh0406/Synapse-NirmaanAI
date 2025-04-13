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

  // Process files for Sandpack when generated files change
  useEffect(() => {
    if (!generatedFiles || generatedFiles.length === 0) {
      setSandpackFiles(DEFAULT_FILES);
      return;
    }

    try {
      const processedFiles = processFilesForSandpack(generatedFiles);
      console.log("Processed files for Sandpack:", Object.keys(processedFiles));
      setSandpackFiles(processedFiles);
      setSandpackError(null);
    } catch (error) {
      console.error("Error processing files for Sandpack:", error);
      setSandpackError(`Error preparing files: ${error.message}`);
      setSandpackFiles(DEFAULT_FILES);
    }
  }, [generatedFiles]);

  // Process files for Sandpack format
  const processFilesForSandpack = (files): SandpackFiles => {
    // Initial file map
    const fileMap: SandpackFiles = {};
    
    // First pass: Add all original files to the map
    files.forEach(file => {
      const normalizedPath = file.path.startsWith('/') 
        ? file.path.substring(1) 
        : file.path;
      
      fileMap[normalizedPath] = { 
        code: file.content,
        active: false // We'll set the active file later
      };
    });
    
    // Check for required files and add them if missing
    ensureRequiredFiles(fileMap);
    
    // Set active file (preferably App.jsx/tsx)
    const appFile = findAppFile(fileMap);
    if (appFile) {
      fileMap[appFile].active = true;
    }
    
    return fileMap;
  };

  // Find the main App file
  const findAppFile = (fileMap: SandpackFiles): string | null => {
    const candidates = [
      "src/App.jsx", 
      "src/App.tsx",
      "src/App.js",
      "src/App.ts"
    ];
    
    for (const candidate of candidates) {
      if (fileMap[candidate]) {
        return candidate;
      }
    }
    
    // If no App file, take the first source file
    const srcFile = Object.keys(fileMap).find(key => 
      key.startsWith("src/") && 
      (key.endsWith(".jsx") || key.endsWith(".tsx") || key.endsWith(".js")));
    
    return srcFile || null;
  };
  
  // Ensure all required files exist
  const ensureRequiredFiles = (fileMap: SandpackFiles) => {
    // Ensure index.html exists
    if (!fileMap["index.html"]) {
      fileMap["index.html"] = {
        code: DEFAULT_FILES["index.html"].code,
        hidden: true
      };
    }
    
    // Ensure entry point exists
    const hasEntryPoint = Object.keys(fileMap).some(path => 
      path === "src/index.js" || path === "src/index.jsx" || 
      path === "src/index.ts" || path === "src/index.tsx" ||
      path === "src/main.jsx" || path === "src/main.tsx");
    
    if (!hasEntryPoint) {
      fileMap["src/index.jsx"] = {
        code: DEFAULT_FILES["src/index.jsx"].code,
        hidden: true
      };
    }
    
    // Ensure styles exist
    const hasStyles = Object.keys(fileMap).some(path => 
      path === "src/index.css" || path === "src/styles.css");
    
    if (!hasStyles) {
      fileMap["src/index.css"] = {
        code: DEFAULT_FILES["src/styles.css"].code,
        hidden: true
      };
    }
    
    // Ensure App component exists
    const appFile = findAppFile(fileMap);
    if (!appFile) {
      // Find a component to use as the main component
      const componentFile = Object.keys(fileMap).find(path => 
        path.includes("/components/") || 
        (fileMap[path].code && fileMap[path].code.includes("export default")));
      
      if (componentFile) {
        // Create an App that imports this component
        const extension = componentFile.split('.').pop();
        const relativePath = componentFile.replace(/^src\//, './');
        const importPath = relativePath.replace(new RegExp(`\\.${extension}$`), '');
        const componentName = componentFile.split('/').pop().replace(new RegExp(`\\.${extension}$`), '');
        
        fileMap["src/App.jsx"] = {
          code: `import React from 'react';\nimport ${componentName} from '${importPath}';\n\nexport default function App() {\n  return <${componentName} />;\n}`,
          hidden: false
        };
      } else {
        // No suitable component found, create a simple App
        fileMap["src/App.jsx"] = {
          code: DEFAULT_FILES["src/App.jsx"].code,
          hidden: false
        };
      }
    }
    
    // Add tailwind config if it's likely being used and not present
    const usesTailwind = Object.values(fileMap).some(file => 
      typeof file === 'object' && file.code && 
      (file.code.includes('className=') || file.code.includes('@tailwind'))
    );
    
    if (usesTailwind && !fileMap["tailwind.config.js"]) {
      fileMap["tailwind.config.js"] = {
        code: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
        hidden: true
      };
      
      // Ensure postcss.config.js exists
      if (!fileMap["postcss.config.js"]) {
        fileMap["postcss.config.js"] = {
          code: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
          hidden: true
        };
      }
      
      // Enhance CSS with Tailwind directives if we created it
      if (!hasStyles) {
        fileMap["src/index.css"] = {
          code: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}`,
          hidden: true
        };
      }
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
            onClick={() => {
              const processed = processFilesForSandpack(generatedFiles);
              setSandpackFiles(processed);
              setSandpackError(null);
            }}
          >
            <RefreshCw size={16} />
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
        {sandpackError && (
          <div className="p-4 mb-2 bg-destructive/10 text-destructive text-sm">
            {sandpackError}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => setSandpackFiles(DEFAULT_FILES)}
            >
              Load Default
            </Button>
          </div>
        )}
        
        {generatedFiles.length > 0 ? (
          <div className="h-full w-full">
            <Sandpack
              template="react"
              files={sandpackFiles}
              theme="dark"
              options={{
                showNavigator: false,
                showLineNumbers: false,
                showInlineErrors: true,
                editorHeight: '100%',
                editorWidthPercentage: 0,
                recompileMode: "delayed",
                recompileDelay: 500,
              }}
              customSetup={{
                dependencies: {
                  "react": "^18.2.0",
                  "react-dom": "^18.2.0",
                  "tailwindcss": "^3.3.0",
                  "framer-motion": "^10.12.0",
                  "@heroicons/react": "^2.0.18"
                },
                devDependencies: {
                  "autoprefixer": "^10.4.14",
                  "postcss": "^8.4.24"
                }
              }}
              autorun={true}
              className="h-full"
            />
          </div>
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

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

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
  'src/styles.css': {
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
    "Helvetica Neue", sans-serif;
}`,
    hidden: true,
  },
  'index.html': {
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    hidden: true,
  },
};