## 🌐 Live Demo
[![Open Live Demo](https://img.shields.io/badge/🌐-Live_Demo-blue)](https://markdown-converter-six.vercel.app/)
[![Vercel Deploy](https://img.shields.io/badge/▲-Deployed_on_Vercel-black)](https://vercel.com)

🔗 **Live App:** https://markdown-converter-six.vercel.app/

## ✨ Features
- ✅ **Real-time conversion** - Text to GitHub Markdown
- ✅ **PWA support** - Install as native app (📥 icon in browser)
- ✅ **Desktop version** - Electron app for Windows/Mac/Linux
- ✅ **GitHub-style preview** - Exact GitHub rendering
- ✅ **Dark/Light mode** - Toggle between themes
- ✅ **Responsive design** - Mobile, tablet, desktop
- ✅ **Quick formatting** - Toolbar for common markdown
- ✅ **Copy to clipboard** - One-click copy formatted markdown
- ✅ **Statistics** - Character/line count in real-time

## 🛠️ Technologies
- **React 18** + **TypeScript** - Frontend framework
- **Electron** - Desktop application
- **Custom CSS** - No frameworks, pure CSS
- **Workbox** - PWA service workers
- **Create React App** - Build tooling

## 📦 Installation

### Option 1: Web PWA (Recommended)
1. Visit the [Live Demo](https://markdown-converter-six.vercel.app/)
2. Look for the 📥 install icon in your browser's address bar
3. Click "Install Markdown Converter"
4. Use it as a native app (works offline!)

### Option 2: Local Development
```bash
# Clone repository
git clone https://github.com/MarceloAdan73/markdown-converter.git
cd markdown-converter

# Install dependencies
npm install

# Development (web only)
npm start
# Open: http://localhost:3000

# Development with Electron
npm start
# Opens both: React dev server + Electron window

# Production build
npm run build
npx serve -s build -l 5000
# Open: http://localhost:5000 (with PWA support)
```
