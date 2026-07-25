<div align="center">
  <img src="https://assets.umod.org/images/rust-logo.png" alt="Rust Server Panel" width="120" />
  <h1>RustServerPanel</h1>
  <p><strong>The Ultimate Open-Source Web Panel for Rust Game Servers</strong></p>
  
  <p>
    <a href="README.md">🇺🇸 English</a> •
    <a href="README.tr.md">🇹🇷 Türkçe</a> •
    <a href="README.zh.md">🇨🇳 中文</a> •
    <a href="README.es.md">🇪🇸 Español</a> •
    <a href="README.ru.md">🇷🇺 Русский</a> •
    <a href="README.de.md">🇩🇪 Deutsch</a>
  </p>

  
  <p>
    <a href="https://github.com/k0d1r/rustserverpanel/issues"><img src="https://img.shields.io/github/issues/k0d1r/rustserverpanel?style=flat-square" alt="Issues" /></a>
    <a href="https://github.com/k0d1r/rustserverpanel/network/members"><img src="https://img.shields.io/github/forks/k0d1r/rustserverpanel?style=flat-square" alt="Forks" /></a>
    <a href="https://github.com/k0d1r/rustserverpanel/stargazers"><img src="https://img.shields.io/github/stars/k0d1r/rustserverpanel?style=flat-square" alt="Stars" /></a>
    <a href="https://github.com/k0d1r/rustserverpanel/blob/main/LICENSE"><img src="https://img.shields.io/github/license/k0d1r/rustserverpanel?style=flat-square" alt="License" /></a>
  </p>

</div>

## 📖 Overview

**RustServerPanel** is a modern, high-performance, and fully open-source game server management panel built specifically for **Rust**. Designed to replace bloated commercial panels, it connects seamlessly via **WebRCON** to provide lightning-fast, real-time control over your server, plugins, and players.

Built with a stunning Glassmorphism UI (Zinc Dark Theme), it offers an unparalleled administrative experience whether you are running a single vanilla server or a massive modded network.

## ✨ Key Features

- 🚀 **Real-time WebRCON Console**: Experience zero-latency commands with an integrated terminal featuring syntax highlighting, auto-scroll, and chat filtering.
- 👥 **Advanced Player Management**: Live player tracking, one-click kicks/bans, Steam profile links, and inventory inspection.
- 🧩 **1-Click Plugin Manager**: Direct integration with uMod/Oxide. Browse, install, update, and remove plugins directly from the web panel.
- ⚙️ **Variables & Config Editor**: Safely edit server convars and JSON configuration files with built-in Monaco syntax validation.
- 💾 **Automated Tasks & Wipes**: Schedule automated Map Wipes, Blueprint Wipes, Full Wipes, and ZIP Backups using robust Cron expressions.
- 🌐 **Global i18n Support**: Natively supports 6 languages (English, Turkish, Chinese, Spanish, Russian, German) out of the box.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, TypeScript, TanStack Query, Recharts, Zustand.
- **Backend**: Node.js, Express, WebSocket (ws), SQLite3 (better-sqlite3), node-cron.
- **Security**: JWT Authentication, bcrypt password hashing, Express Rate Limiting.

## 📦 Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A running Rust Game Server with WebRCON enabled (`+rcon.web 1`)

### 1. Clone the Repository
```bash
git clone https://github.com/k0d1r/rustserverpanel.git
cd rustserverpanel
```

### 2. Setup Backend
```bash
cd backend
npm install
# Copy the example environment variables
cp .env.example .env
# Start the production build
npm run build
npm start
```
*Note: Default login is Username: `admin`, Password: `admin123`*

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run build
npm run preview
```

## 🤝 Contributing
Contributions are always welcome! Feel free to open a pull request or an issue if you have suggestions for improvements.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
**SEO Keywords**: Rust Server Panel, Rust RCON, WebRCON, Oxide Admin, uMod Manager, Rust Dedicated Server, Game Server Panel, Open Source Rust Panel.

<div align="center">
  <i>Created with ❤️ by <a href="https://github.com/k0d1r">k0d1r</a></i>
</div>