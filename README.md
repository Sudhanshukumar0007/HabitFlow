# 🌊 HabitFlow — Daily Habit Tracker

A full-stack production-ready **MERN** habit tracker with streaks, gamification, analytics, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment
Edit `server/.env` with your values:
```env
MONGO_URI=mongodb://localhost:27017/habitflow
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id       # optional
GOOGLE_CLIENT_SECRET=your_google_client_secret # optional
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

### 3. Run Development
```bash
npm run dev   # Starts both server (5000) and client (5173)
```

Or run separately:
```bash
npm run server   # Express API on :5000
npm run client   # Vite React on :5173
```

## 📁 Project Structure
```
HabitFlow/
├── server/              # Express.js backend
│   ├── config/          # DB + Passport config
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth + error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Streak, XP, email, badge utils
│   └── server.js
└── client/              # Vite + React frontend
    └── src/
        ├── api/         # Axios API functions
        ├── components/  # Reusable UI components
        ├── context/     # Auth, Theme, Habit contexts
        ├── pages/       # Page components
        └── utils/       # Date, badge utilities
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/habits` | Get all habits |
| POST | `/api/habits` | Create habit |
| PUT | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Soft delete |
| PATCH | `/api/habits/:id/toggle` | Toggle completion |
| PATCH | `/api/habits/:id/archive` | Archive |
| PATCH | `/api/habits/reorder` | Reorder |
| GET | `/api/analytics/summary` | Summary stats |
| GET | `/api/analytics/heatmap` | Year heatmap |
| GET | `/api/analytics/monthly` | Monthly data |
| GET | `/api/analytics/habits/:id` | Habit trend |
| GET | `/api/notes` | Get notes |
| POST | `/api/notes` | Create note |
| DELETE | `/api/notes/:id` | Delete note |
| PUT | `/api/user/settings` | Update settings |
| DELETE | `/api/user` | Delete account |
| GET | `/api/user/:username/public` | Public profile |
| GET | `/api/export/csv` | Export CSV |

## ✨ Features
- 📅 Monthly habit grid with completion cells
- 🔥 Streak tracking (current + longest)
- ⭐ XP & Level system (5 levels)
- 🏅 7 achievable badges
- 📊 Analytics: heatmap, bar charts, line charts, donut charts
- 📝 Notes with Markdown support
- 🌙 Dark mode
- 🎊 Confetti on completing all habits
- ↩️ Undo last toggle (5-second window)
- 🔄 Drag & drop habit reordering
- 🔐 JWT auth + Google OAuth
- 📧 Password reset emails
- 🌐 Public profile pages
- 📥 CSV export

## ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `N` | New Habit |
| `A` | Complete All Today |
| `Esc` | Close modal |
