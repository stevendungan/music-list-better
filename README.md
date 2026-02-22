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
- A C/C++ toolchain for compiling native modules (`better-sqlite3` uses `node-gyp`)
  - **macOS**: Install Xcode Command Line Tools — `xcode-select --install`
  - **Ubuntu/Debian**: `sudo apt install build-essential python3`
  - **Windows**: Install Visual Studio Build Tools or run `npm install -g windows-build-tools`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

This starts both the API server (port 3000) and frontend dev server (port 5173) concurrently.

Open http://localhost:5173 in your browser.

The SQLite database (`data/music.db`) is created automatically on first run if it doesn't already exist.

## Project Structure

```
music-list-better/
├── src/
│   ├── client/     # Frontend (HTML, CSS, TypeScript)
│   └── server/     # Backend API (Hono + SQLite)
└── data/           # SQLite database
```

## Tech Stack

- **Frontend**: Vite + TypeScript + HTML + CSS
- **Backend**: Hono (Node.js)
- **Database**: SQLite (better-sqlite3)
