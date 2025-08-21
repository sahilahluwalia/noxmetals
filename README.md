# NoxMetals - Full-Stack Remake

A full-stack remake of the NoxMetals application, replicating all core features, fixing features that are not working in the original Loveable-built site and adding extra enhancements. Built with the same tech stack as the original.

## ✨ Enhanced Features

This remake includes several features that the original doesn't have or weren't accessible:

- **🔐 Social Authentication**: Login with OAuth providers (Google, GitHub, etc.)
- **📧 Automated Email Notifications**: Emails sent on quote rejection or acceptance with custom templates
- **👨‍💼 Admin Dashboard**: Complete admin panel for managing users, quotes, and system operations

## 🤖 AI-Generated Prototype

**Important Notice**: The major portion of this code is written by AI to build a prototype fast for rapid shipping. This is **NOT production-ready code**. A lot of code can be written better for:

- Code maintainability
- Proper architecture
- Scalability
- Performance optimization
- User experience improvements

This project serves as a proof-of-concept and rapid prototype to validate features and functionality.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React
- **Backend**: Supabase
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## 🚀 Quick Setup

```bash
pnpm install
cp .env.example .env.local  # Configure Supabase credentials
pnpm dev
```

## 📁 Project Structure

```
├── app/                 # Next.js App Router
├── components/          # Reusable UI components
├── utils/              # Utility functions and schemas
├── emails/             # Email templates
└── public/             # Static assets
```

## ⚠️ Development Status

This is a prototype designed for:
- ✅ Fast feature validation
- ✅ Quick proof-of-concept
- ✅ Demonstrating core functionality


## 📄 License

This project is for prototype and demonstration purposes.