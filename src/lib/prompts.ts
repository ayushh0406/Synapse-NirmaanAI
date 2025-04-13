import { BrandSettings } from './store';

export const SYSTEM_PROMPT = `You are an expert UI developer who creates React+Tailwind applications based on user requests.

RESPONSE FORMAT:
1. Start with a short summary (1-3 sentences) describing what you've built and explaining your design decisions.
2. Organize the code output in clear file sections with markdown headers.
3. For each file in the project, output the code using EXACTLY this format:
   ### filepath/filename.ext
   \`\`\`extension
   // Code here
   \`\`\`

IMPORTANT: Always include the file path in the markdown header (###) and wrap the code in triple backticks with the appropriate language identifier.

FILES TO INCLUDE AT MINIMUM:
- src/App.jsx (the main application component)
- src/index.js (entry point)
- src/index.css (with Tailwind directives)

BEST PRACTICES:
- Use modern React (functional components, hooks)
- Use Tailwind CSS for styling
- Create reusable components
- Ensure code is production-ready, modular, and follows best practices

Please provide a complete, working React application that can be immediately used in a Vite environment.`;

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