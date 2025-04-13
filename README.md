# 🧠 Synapse NirmaanAI – Multimodal UI Generator for eCommerce

> ⚡ Powered by AI | Built with React + TailwindCSS + Groq API

Synapse NirmaanAI is a multimodal AI-powered UI generator for eCommerce brands that allows you to generate **brand-aligned static or animated landing pages** using **text prompts, brand inputs, and product images**.

Perfect for hackathons, product teams, and solo founders who want to go from **idea → design → deploy** in minutes.

---

## 🚀 Features

### ✅ Phase 1: Prompt-Based Page Generation
- Text prompt input (e.g., “Minimal perfume landing page”)
- Generates JSX + TailwindCSS layout using Mixtral (via Groq API)
- Live code preview + editor
- Export as ZIP / HTML / React

### ✅ Phase 2: Brand Inputs (Multimodal Enhancer)
- Upload product image (e.g., sneakers, phone, etc.)
- Set brand colors, fonts, and tone (Minimal / Playful / Luxury)
- AI merges prompt + brand style into generated layout

### ✅ Phase 3: Iteration & Improvement
- Modify prompt, tweak fonts/colors, re-upload image
- “Make it more Gen Z” → real-time design update
- Add subtle animations with Framer Motion

### ✅ Phase 4: UI Customization Panel
- Drag/drop sections (Hero / Features / CTA / etc.)
- Inline text editing
- Color palette + spacing controls

### ✅ Phase 5: Export & Deployment
- Download full React project
- Deploy to Vercel or Netlify
- Shopify Liquid Export (WIP 🚧)

---

## 🧱 Tech Stack

| Layer       | Tech                            |
|-------------|----------------------------------|
| Frontend    | React + TailwindCSS             |
| Backend     | Node.js + Express               |
| AI Model    | Groq API (`mixtral-8x7b-32768`) |
| Image Upload| Cloudinary                      |
| Editor      | Monaco Editor (VS Code style)   |
| Preview     | Sandpack (Code live rendering)  |
| Storage     | Firebase / Supabase (optional)  |

---

## 📦 Setup & Installation Guide

### ✅ STEP 1: Clone the Repo

```bash
git clone https://github.com/ayushh0406/Synapse-NirmaanAI.git
cd Synapse-NirmaanAI

✅ STEP 2: Install Dependencies
2.1 Frontend Setup
bash
Copy
Edit
cd client
npm install
2.2 Backend Setup
bash
Copy
Edit
cd ../server
npm install
✅ STEP 3: Add Environment Variables
3.1 Go to server/ folder:
bash
Copy
Edit
cd server
3.2 Create a .env file:
bash
Copy
Edit
touch .env
3.3 Add your Groq API key like this:
env
Copy
Edit
GROQ_API_KEY=your_actual_groq_key
(Don't commit .env to GitHub for security)

✅ STEP 4: Run the Project Locally
4.1 Start the Backend Server
bash
Copy
Edit
cd server
node index.js
It should run at: http://localhost:5000

4.2 Start the Frontend
bash
Copy
Edit
cd ../client
npm start
It should open: http://localhost:3000

🧪 Try Example Prompts
txt
Copy
Edit
"Build a minimal skincare landing page with a clean hero and soft colors"
"Create a luxury perfume site with serif fonts and pastel tones"
"Use product image in hero, Montserrat font, and modern layout"
