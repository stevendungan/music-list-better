# Music List Better

A personal music collection app for tracking ranked favorite albums.

## Features

- Ranked list of favorite albums (1 to N)
- Track last played date for each album
- Add, edit, and delete albums
- View by rank or by last played
- "Played" button to mark an album as played today

## Requirements

- Node.js 18+
- npm

## How to Run

### 1. Install dependencies

```bash
npm install
```

### 2. Migrate data from old app (one-time)

If you have an existing database from the Flask music-list app:

```bash
npm run migrate
```

This reads from `../music-list/app.db` (read-only) and copies albums to `data/music.db`.

### 3. Start development server

```bash
npm run dev
```

This starts both the API server (port 3000) and frontend dev server (port 5173).

Open http://localhost:5173 in your browser.

## Project Structure

```
music-list-better/
├── src/
│   ├── client/     # Frontend (HTML, CSS, TypeScript)
│   └── server/     # Backend API (Hono + SQLite)
├── scripts/        # Migration script
└── data/           # SQLite database
```

## Tech Stack

- **Frontend**: Vite + TypeScript + HTML + CSS
- **Backend**: Hono (Node.js)
- **Database**: SQLite (better-sqlite3)
