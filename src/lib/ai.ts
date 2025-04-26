import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

interface ProductCardParams {
  name: string;
  description: string;
  imageUrl?: string;
  colorTheme: string;
  designPrompt?: string;
}

export async function generateProductCard(params: ProductCardParams): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `
    Generate a React component for a product card with the following details:
    
    Product Name: ${params.name}
    Product Description: ${params.description}
    ${params.imageUrl ? `Image URL: ${params.imageUrl}` : 'No image provided'}
    Color Theme: ${params.colorTheme}
    ${params.designPrompt ? `Design Instructions: ${params.designPrompt}` : ''}
    
    Requirements:
    1. Create a single React functional component using modern React syntax
    2. Use only Tailwind CSS classes for styling (no inline styles)
    3. Make the card responsive
    4. Include a "Buy Now" button with appropriate styling
    5. If an image URL is provided, include it in the component
    6. Follow the specified color theme: ${params.colorTheme}
    7. Return ONLY the component code without imports, exports or surrounding text
    8. Format the code properly with consistent indentation
    
    The returned code should be in this format (replace with actual implementation):
    
    function ProductCard() {
      return (
        <div className="...">
          // Component implementation here
        </div>
      );
    }
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the code from the response if needed
    let code = text.trim();
    
    // If the code is wrapped in markdown code blocks, remove them
    if (code.startsWith("```") && code.endsWith("```")) {
      code = code.substring(code.indexOf("\n") + 1, code.lastIndexOf("```")).trim();
    }
    
    if (code.startsWith("```jsx") || code.startsWith("```tsx") || code.startsWith("```javascript")) {
      code = code.substring(code.indexOf("\n") + 1, code.lastIndexOf("```")).trim();
    }
    
    return code;
  } catch (error) {
    console.error("Error generating product card:", error);
    throw new Error("Failed to generate product card");
  }
}