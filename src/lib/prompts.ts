import { BrandSettings } from './store';

export const SYSTEM_PROMPT = `You are an expert UI developer who creates React+Tailwind applications based on user requests.

RESPONSE FORMAT:
1. First provide a SHORT summary (1-2 sentences) of the UI you're building and your design decisions.
2. Then provide ALL the code needed for a complete working React app with Tailwind CSS.
3. Format each file with the following pattern EXACTLY:

### filepath/filename.ext
\`\`\`jsx
// Code here
\`\`\`

REQUIRED FILES - YOU MUST INCLUDE:
- index.html - The HTML entry with a div#root
- src/index.jsx - Entry point that renders the App component
- src/App.jsx - Main application component 
- src/index.css - CSS with Tailwind imports (@tailwind base; @tailwind components; @tailwind utilities;)
- tailwind.config.js - Tailwind configuration

MUST-FOLLOW RULES:
- Use Tailwind CSS for all styling (no custom CSS except through Tailwind utilities)
- Use simple React components without complex dependencies
- Make sure all JSX components properly return markup
- Avoid complex state management solutions
- Keep component nesting minimal
- All imports must be either from 'react' or relative imports of your own files
- Triple check closing tags and element nesting in JSX
- Don't import from external component libraries except react itself
- Ensure the application will render in a browser with minimal dependencies

YOUR CODE MUST BE AS SELF-CONTAINED AND SIMPLE AS POSSIBLE TO ENSURE IT WILL RENDER IN A PREVIEW.`;

export function formatPrompt(userPrompt: string, brandSettings?: BrandSettings, conversationContext?: string): string {
  // Basic prompt
  let enhancedPrompt = userPrompt;
  
  // Add brand context if available
  if (brandSettings) {
    enhancedPrompt += `\n\nPlease follow these brand guidelines:
    - Primary color: ${brandSettings.primaryColor}
    - Secondary color: ${brandSettings.secondaryColor}
    - Font family: ${brandSettings.font}`;
  }
  
  // Add conversation context for iterative prompts
  if (conversationContext) {
    enhancedPrompt += `\n\nThis is a follow-up request. Previous conversation context:\n${conversationContext}\n\nPlease update the previous code based on this new request.`;
  }
  
  return enhancedPrompt;
}

export function analyzePrompt(prompt: string): {
  intent: string;
  uiType: string;
  complexity: 'simple' | 'medium' | 'complex';
  features: string[];
} {
  // This is a simple implementation - in a real app, this could use 
  // a separate LLM call to analyze the prompt
  
  const hasLanding = /landing|home page/i.test(prompt);
  const hasEcommerce = /shop|store|product|ecommerce/i.test(prompt);
  const hasDashboard = /dashboard|admin|analytics/i.test(prompt);
  const hasForm = /form|contact|signup|login/i.test(prompt);
  
  let uiType = 'general';
  if (hasLanding) uiType = 'landing';
  else if (hasEcommerce) uiType = 'ecommerce';
  else if (hasDashboard) uiType = 'dashboard';
  else if (hasForm) uiType = 'form';
  
  // Simple complexity analysis
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  const promptWords = prompt.split(' ').length;
  if (promptWords > 30) complexity = 'complex';
  else if (promptWords > 15) complexity = 'medium';
  
  // Extract key features
  const features: string[] = [];
  if (prompt.includes('dark mode') || prompt.includes('dark theme')) features.push('darkMode');
  if (prompt.includes('animation') || prompt.includes('motion')) features.push('animations');
  if (prompt.includes('responsive')) features.push('responsive');
  
  return {
    intent: prompt.substring(0, 50) + '...',
    uiType,
    complexity,
    features
  };
}