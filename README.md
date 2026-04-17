<div align="center">

<img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>

<br/><br/>

# ✅ TaskFlow

### A full-stack, AI-powered personal task manager.

[**🚀 Live Demo**](https://taskflow-app-v2.vercel.app) · [**📝 Share Feedback**](https://docs.google.com/forms/d/e/1FAIpQLSegTBIFmQCh-wR90E393Aj_qszr_TCOPxM5NA9iH29SljmN0A/viewform?usp=sharing)

</div>

---

## 📖 About

TaskFlow is a modern task management app built with **Next.js**, **React 19**, and **PostgreSQL**. It supports Google OAuth and email/password login, includes an AI assistant powered by Google Gemini, and features a clean, responsive UI that works great on any device.

---

## ✨ Features

- 🔐 **Authentication** — Google OAuth + Email/Password sign-in
- ✅ **Task Management** — Create, edit, prioritize, and track tasks
- 🤖 **AI Enhancement** — Let Gemini AI improve your task descriptions instantly
- 🔔 **Smart Alerts** — Header notifications for overdue and high-priority tasks
- 🎉 **Celebrations** — Confetti animation when you crush a task
- 📊 **Productivity Score** — Live sidebar tracker for your completion progress
- 🌙 **Dark Mode** — Full light/dark theme support
- 📱 **Fully Responsive** — Optimized for mobile, tablet, and desktop

---

## 🛠️ Built With

- **Next.js 16** · **React 19** · **TypeScript**
- **Tailwind CSS v4** · **Radix UI** · **Lucide Icons**
- **Prisma ORM** · **PostgreSQL** (Supabase)
- **NextAuth v5** · **Google Gemini AI** · **SWR**

---

## 🚀 Running Locally

```bash
# 1. Clone the repo
git clone https://github.com/gideonagbavor8/taskflow-app-v2.git
cd taskflow-app-v2

# 2. Install dependencies
pnpm install

# 3. Set up your .env file (see below)

# 4. Set up the database
pnpm db:generate
pnpm db:migrate

# 5. Start the dev server
pnpm dev
```

### Environment Variables

```env
DATABASE_URL=""
DIRECT_URL=""
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_GEMINI_API_KEY=""
```

---

## 📄 License

MIT — feel free to use, fork, and build on this project.

---

<div align="center">

Built with ❤️ by [Gideon Agbavor](https://github.com/gideonagbavor8)

⭐ If you found this useful, drop a star!

</div>
