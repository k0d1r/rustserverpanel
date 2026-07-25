# Contributing to RustServerPanel

Thank you for your interest in contributing! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/rustserverpanel.git`
3. Install dependencies: `npm run install:all`
4. Create a branch: `git checkout -b feature/your-feature`
5. Make your changes
6. Test everything works
7. Submit a Pull Request

## Development Setup

```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

## Code Style

- TypeScript with strict mode enabled
- Use descriptive variable names
- Add JSDoc comments for exported functions
- Handle errors properly (no silent catches)

## Areas Needing Help

- 📱 Mobile responsive design
- 🗺️ Live map integration (RustMaps API)
- 💾 SFTP file manager
- 🔔 Discord webhook notifications
- 🌍 Internationalization (i18n)
- 🧪 Unit tests
- 📖 Documentation

## Reporting Issues

Use [GitHub Issues](https://github.com/yourusername/rustserverpanel/issues) with:
- Your OS and Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Any relevant logs

## Pull Request Guidelines

- Keep PRs focused on a single feature/fix
- Update README if needed
- Test with a real Rust server if possible
- Describe what changed and why
