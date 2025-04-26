import axios from 'axios';
import { BrandSettings } from './store';
import { Message } from './types';
import JSZip from 'jszip';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

interface GenerationResult {
  rawResponse: string;
  summary?: string;
  files: GeneratedFile[];
  promptAnalysis?: any;
}

// Helper function to extract code blocks from a markdown string
function extractCodeBlocks(markdown: string): { language: string; code: string }[] {
  const codeBlockRegex = /```([a-zA-Z0-9_+-]+)?\s*([\s\S]*?)```/g;
  const codeBlocks: { language: string; code: string }[] = [];
  
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const language = match[1]?.trim() || 'text';
    const code = match[2]?.trim() || '';
    codeBlocks.push({ language, code });
  }
  
  return codeBlocks;
}

// Helper function to extract file path from a potential title or comment
function getFilePath(text: string, language: string): string {
  // Check for filepath: pattern
  const filepathMatch = text.match(/filepath:\s*([^\s]+)/);
  if (filepathMatch) return filepathMatch[1];
  
  // Try to find a reasonable filename from the first line
  const firstLine = text.split('\n')[0];
  if (firstLine.includes('/')) {
    return firstLine.trim();
  }
  
  // Default to a filename based on the language
  const extensionMap: Record<string, string> = {
    js: 'script.js',
    jsx: 'component.jsx',
    ts: 'script.ts',
    tsx: 'component.tsx',
    html: 'index.html',
    css: 'styles.css',
    json: 'data.json',
    md: 'readme.md',
    python: 'script.py',
    py: 'script.py',
    java: 'Main.java',
    cpp: 'main.cpp',
    'c++': 'main.cpp',
    c: 'main.c',
    go: 'main.go',
    rust: 'main.rs',
    php: 'index.php',
    rb: 'script.rb',
    ruby: 'script.rb',
    swift: 'main.swift',
    kotlin: 'Main.kt',
  };
  
  return extensionMap[language] || 'file.txt';
}

// Process markdown to extract files and summary
function processGeminiResponse(markdown: string): GenerationResult {
  const codeBlocks = extractCodeBlocks(markdown);
  
  // Find summary text - text before the first code block
  const summaryMatch = markdown.match(/^([\s\S]*?)```/);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";
  
  const files: GeneratedFile[] = [];
  
  codeBlocks.forEach((block, index) => {
    // Try to determine file name from code comments or context
    const path = getFilePath(block.code, block.language);
    
    files.push({
      path,
      content: block.code,
      language: block.language
    });
  });
  
  // Ensure we have all required files for a working React app
  if (files.length > 0) {
    ensureRequiredFiles(files);
  }
  
  return {
    rawResponse: markdown,
    summary,
    files
  };
}

// Ensure we have all required files for a working React app
function ensureRequiredFiles(files: Array<{ path: string; content: string; language: string }>) {
  // Check for index entry point
  const hasIndex = files.some(f => 
    f.path === 'src/index.js' || 
    f.path === 'src/index.jsx' || 
    f.path === 'src/index.tsx' ||
    f.path === 'src/main.jsx' || 
    f.path === 'src/main.tsx'
  );
  
  if (!hasIndex) {
    files.push({
      path: 'src/index.jsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      language: 'javascript'
    });
  }
  
  // Check for App component
  const hasApp = files.some(f => 
    f.path === 'src/App.js' || 
    f.path === 'src/App.jsx' || 
    f.path === 'src/App.tsx'
  );

  if (!hasApp) {
    // Find a component to use as the main App
    const componentFile = files.find(f => 
      f.content.includes('export default') && 
      (f.path.endsWith('.jsx') || f.path.endsWith('.js') || f.path.endsWith('.tsx'))
    );

    if (componentFile) {
      const importPath = `./${componentFile.path.replace('src/', '')}`.replace(/\.[^/.]+$/, '');
      const componentName = importPath.split('/').pop();

      files.push({
        path: 'src/App.jsx',
        content: `import React from 'react';
import ${componentName} from '${importPath}';

export default function App() {
  return <${componentName} />;
}`,
        language: 'javascript'
      });
    } else {
      files.push({
        path: 'src/App.jsx',
        content: `import React from 'react';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold">Generated UI</h1>
        <p className="text-center text-gray-600">Your application is ready!</p>
      </div>
    </div>
  );
}`,
        language: 'javascript'
      });
    }
  }
  
  // Check for HTML file
  const hasHtml = files.some(f => f.path === 'index.html');
  
  if (!hasHtml) {
    files.push({
      path: 'index.html',
      content: `<!DOCTYPE html>
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
      language: 'html'
    });
  }
  
  // Check for CSS file
  const hasCss = files.some(f => 
    f.path === 'src/index.css' || 
    f.path === 'src/App.css' ||
    f.path === 'src/styles.css'
  );
  
  if (!hasCss) {
    files.push({
      path: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 0;
}`,
      language: 'css'
    });
  }
  
  // Check for tailwind config
  const hasTailwindConfig = files.some(f => f.path === 'tailwind.config.js');
  
  if (!hasTailwindConfig) {
    files.push({
      path: 'tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
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
      language: 'javascript'
    });
  }
  
  // Check for postcss config
  const hasPostcssConfig = files.some(f => f.path === 'postcss.config.js');
  
  if (!hasPostcssConfig) {
    files.push({
      path: 'postcss.config.js',
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      language: 'javascript'
    });
  }
}

export async function exportProject(files: Array<{ path: string; content: string }>): Promise<Blob> {
  const zip = new JSZip();
  
  // Add each file to the zip
  files.forEach(({path, content}) => {
    zip.file(path, content);
  });

  // Add package.json if it doesn't exist
  if (!files.find(f => f.path === 'package.json')) {
    zip.file(
      'package.json',
      JSON.stringify(
        {
          name: 'generated-ui',
          private: true,
          version: '0.0.1',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            'framer-motion': '^11.0.0',
            '@heroicons/react': '^2.0.0',
            'clsx': '^2.0.0',
            'tailwindcss': '^3.4.0',
          },
          devDependencies: {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            '@vitejs/plugin-react': '^4.2.0',
            'autoprefixer': '^10.4.0',
            'postcss': '^8.4.0',
            'typescript': '^5.2.0',
            'vite': '^5.0.0',
          },
        },
        null,
        2
      )
    );
  }

  return await zip.generateAsync({ type: 'blob' });
}

export const generateUI = async (
  prompt: string,
  brandSettings: BrandSettings,
  conversationHistory: Message[] = []
): Promise<GenerationResult> => {
  console.log('Generating UI with Gemini...');
  
  try {
    // Extract previous messages in a format Gemini can understand
    const previousMessages = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model' instead of 'assistant'
      parts: [{ text: msg.content }]
    }));
    
    // Format the prompt with brand settings
    const fullPrompt = `
You are a UI/UX expert and frontend developer. Generate a complete React application based on the following requirements.
Use Tailwind CSS for styling.

Brand Guidelines:
- Primary Color: ${brandSettings.primaryColor}
- Secondary Color: ${brandSettings.secondaryColor}
- Font: ${brandSettings.font}
- Border Radius: ${brandSettings.borderRadius}px
- Style: ${brandSettings.style}

Requirements: ${prompt}

Return your response with a brief explanation followed by the complete code implementation.
Format each file with a header containing the filepath, followed by the code in markdown format.
For example:

Here's a React application that implements your requirements...

\`\`\`tsx
// filepath: src/App.tsx
import React from 'react';
...
\`\`\`

\`\`\`css
/* filepath: src/index.css */
@tailwind base;
...
\`\`\`
`;

    const payload = {
      contents: [
        ...previousMessages,
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, 
      payload
    );

    if (!response.data || !response.data.candidates || !response.data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API");
    }

    const textResponse = response.data.candidates[0].content.parts[0].text;
    console.log("Received response from Gemini");

    // Process response to extract files and summary
    const result = processGeminiResponse(textResponse);
    
    return result;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error(`Failed to generate UI: ${error.message}`);
  }
};