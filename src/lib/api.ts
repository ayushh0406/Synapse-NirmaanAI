import { Groq } from "groq-sdk";
import { BrandSettings } from './store';
import { SYSTEM_PROMPT, formatPrompt, analyzePrompt } from './prompts';
import JSZip from 'jszip';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function generateUI(prompt: string, brandSettings?: BrandSettings, conversationHistory: Message[] = []) {
  try {
    console.log("Starting UI generation with prompt:", prompt);
    // Analyze prompt to understand user intent
    const promptAnalysis = analyzePrompt(prompt);
    
    // Create conversation context from history
    const recentMessages = conversationHistory.slice(-4); // Last 4 messages for context
    const conversationContext = recentMessages.length > 0 
      ? recentMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')
      : undefined;
    
    // Format the prompt with brand settings and conversation context
    const enhancedPrompt = formatPrompt(prompt, brandSettings, conversationContext);
    console.log("Enhanced prompt:", enhancedPrompt);

    // Prepare messages for API call
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: enhancedPrompt }
    ];

    // Call Groq API
    console.log("Sending request to Groq API");
    const completion = await groq.chat.completions.create({
      messages: messages.map(msg => ({ 
        role: msg.role as any, 
        content: msg.content 
      })),
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content || '';
    console.log("Received response from API:", response.substring(0, 100) + "...");
    
    // Extract summary and code sections
    const summary = extractSummary(response);
    const files = parseGeneratedFiles(response);
    
    if (files.length === 0) {
      console.warn("No files were parsed from the response");
      // Fallback parsing attempt
      const simpleFile = {
        path: 'src/App.jsx',
        content: response,
        language: 'javascript'
      };
      return {
        summary: "Generated UI code",
        files: [simpleFile],
        rawResponse: response,
        promptAnalysis
      };
    }
    
    console.log("Successfully parsed files:", files.map(f => f.path));
    return {
      summary,
      files,
      rawResponse: response,
      promptAnalysis
    };
  } catch (error) {
    console.error('Error generating UI:', error);
    throw new Error('Failed to generate UI. Please try again.');
  }
}

function extractSummary(response: string): string {
  // Extract the summary, which is the text before the first file section
  const summaryMatch = response.match(/^([\s\S]*?)(?=###\s+\S+|\s*$)/);
  return summaryMatch ? summaryMatch[1].trim() : '';
}

export function parseGeneratedFiles(response: string): Array<{ path: string; content: string; language: string }> {
  const files = [];
  
  // Try multiple regex patterns to be more robust
  const patterns = [
    // Standard markdown code blocks with file headers
    /### (.*?)\r?\n```(?:([a-z]*))\r?\n([\s\S]*?)```/g,
    
    // Alternative format with @file annotations
    /\/\*\* @file (.*?) \*\/\r?\n([\s\S]*?)(?=\/\*\* @file|$)/g,
    
    // Look for code blocks with language identifiers
    /```([a-z]*)\r?\n([\s\S]*?)```/g,
    
    // Fallback pattern for code blocks without language
    /```\r?\n([\s\S]*?)```/g
  ];
  
  // Try each pattern in sequence
  let matchFound = false;
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern);
    let match;
    let tempResponse = response;
    
    while ((match = regex.exec(tempResponse)) !== null) {
      let path, content, language;
      
      if (pattern.toString().includes("@file")) {
        // Handle @file annotation format
        path = match[1].trim();
        content = match[2].trim();
      } else if (pattern.toString().includes("###")) {
        // Handle markdown header format
        path = match[1].trim();
        language = match[2] || '';
        content = match[3].trim();
      } else if (match.length === 3) {
        // Handle code block with language
        const lang = match[1] || 'jsx';
        content = match[2].trim();
        
        // Derive a reasonable filename based on content
        if (content.includes("export default function App") || content.includes("function App")) {
          path = `src/App.${lang}`;
        } else if (content.includes("createRoot") || content.includes("ReactDOM.render")) {
          path = `src/index.${lang}`;
        } else if (content.includes("@tailwind") || content.includes("tailwindcss")) {
          path = `src/index.css`;
        } else {
          path = `src/Component${files.length + 1}.${lang}`;
        }
      } else {
        // Handle code block without language identifier
        content = match[1].trim();
        
        // Try to guess the file type from content
        if (content.includes("<html") || content.includes("<!DOCTYPE html")) {
          path = "index.html";
        } else if (content.includes("@tailwind") || content.includes(".class")) {
          path = "src/index.css";
        } else {
          path = `src/Component${files.length + 1}.jsx`;
        }
      }
      
      // Try to extract better file path from code comments
      const filePathComment = content.match(/\/\/ filepath: (.*)/);
      if (filePathComment && filePathComment[1]) {
        path = filePathComment[1].trim();
      }

      // Clean the path (remove leading ./ if present)
      path = path.replace(/^\.\//, '');
      
      // Determine language from file extension
      const extension = path.split('.').pop()?.toLowerCase();
      let language;
      
      switch (extension) {
        case 'js':
        case 'jsx':
          language = 'javascript';
          break;
        case 'ts':
        case 'tsx':
          language = 'typescript';
          break;
        case 'css':
          language = 'css';
          break;
        case 'json':
          language = 'json';
          break;
        case 'html':
          language = 'html';
          break;
        default:
          language = 'javascript';
      }
      
      // Skip duplicate files (same path)
      if (!files.some(f => f.path === path)) {
        files.push({ path, content, language });
        matchFound = true;
      }
    }
    
    // If we found matches with this pattern, stop trying others
    if (matchFound) break;
  }

  // Add necessary files if missing
  if (files.length > 0) {
    ensureRequiredFiles(files);
  }
  
  console.log("Parsed files:", files.map(f => f.path));
  return files;
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