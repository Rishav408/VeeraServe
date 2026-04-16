# VeeraServe AI 🍲

VeeraServe is a premium, AI-powered restaurant service platform that transforms the dining experience with a multimodal "AI Waiter." Built for high performance and visual excellence, it bridges the gap between traditional food ordering and modern AI assistance.

![VeeraServe Hero](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000)

## ✨ Features

- **🤖 Multimodal AI Waiter (Veera Bot):**
  - **Text Interaction:** Chat with the AI for recommendations, menu details, and ordering.
  - **Voice Support:** Speak your order directly—transcribed in real-time using `faster-whisper`.
  - **Vision Capabilities:** Upload photos of dishes or menus for the AI to analyze using `Qwen2.5-VL`.
- **💎 Premium UI/UX:**
  - **3D Visuals:** Layered depth effects and custom shadows for a tactile feel.
  - **Micro-animations:** Powered by `Framer Motion` for smooth page transitions and interactive elements.
  - **Responsive Design:** Optimized for both mobile and desktop browsing.
- **🛒 Ordering System:**
  - Interactive menu with category filtering.
  - Real-time cart management.
  - Order tracking and feedback system.
- **🛡️ Admin Dashboard:**
  - Manage menu items, view active orders, and track business performance.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (Custom Design System)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router DOM

### Backend
- **Framework:** FastAPI (Python)
- **AI Orchestration:** LangChain
- **LLM Engine:** Ollama (Model: `qwen2.5vl:3b`)
- **Transcription (STT):** Faster-Whisper
- **Communication:** Multipart Form-Data for text, image, and voice streaming.

## 🚀 Getting Started

### Prerequisites
- [Ollama](https://ollama.com/) installed and running.
- Pull the multimodal model: `ollama pull qwen2.5vl:3b`
- Node.js & Python 3.9+

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python main.py
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup
1. From the project root, install packages:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

## 📁 Project Structure

```text
VeeraServe/
├── backend/            # FastAPI Backend
│   ├── routes/         # API Endpoints (Chat, Voice)
│   ├── services/       # AI & Transcription logic
│   └── main.py         # Entry point
├── src/                # React Frontend
│   ├── components/     # Reusable UI components
│   ├── screens/        # Page-level components
│   ├── context/        # State management (CM, Cart)
│   └── utils/          # API & helper functions
└── data/               # Global configuration & menu data
```

## 📝 License
This project is part of the VeeraServe ecosystem. All rights reserved.
