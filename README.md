# Rainbow Chat

A futuristic anonymous group chat web app built with Next.js App Router, TypeScript, Tailwind CSS, Firebase Auth, Firestore, Framer Motion, Lucide React, and emoji picker support.

## Features

- Firebase anonymous authentication
- Auto-generated anonymous usernames and avatars
- Public and private rooms
- Private room code joining
- Real-time Firestore messages with `onSnapshot`
- Typing indicator
- Emoji picker
- Auto-scroll chat
- Bad-word filter, cooldown, duplicate-message prevention, and length limit
- Report messages to the `reports` collection
- Admin-only message delete
- Rainbow neon glassmorphism UI

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Firebase project.
3. Enable **Authentication > Sign-in method > Anonymous**.
4. Enable **Firestore Database**.
5. Copy `.env.example` to `.env.local` and fill in your Firebase web app config.
6. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Firestore Rules

A starter rules file is included in `firestore.rules`. Review and tighten rules before production launch.

## Deployment

Deploy on Vercel or Firebase Hosting. For Vercel, add the same Firebase environment variables in the Vercel project settings.
