/**
 * Migration script to import favorites from the old Flask app.
 * Opens the source database in READ-ONLY mode - no modifications are made.
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Source: old Flask app database (READ-ONLY)
const sourcePath = join(__dirname, '../../music-list/app.db')
const sourceDb = new Database(sourcePath, { readonly: true })

// Destination: new app database
const destPath = join(__dirname, '../data/music.db')
const destDb = new Database(destPath)

// Create table if it doesn't exist
destDb.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rank INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    year INTEGER,
    last_played TEXT
  )
`)

// Check if we already have data
const existingCount = destDb.prepare('SELECT COUNT(*) as count FROM favorites').get() as { count: number }
if (existingCount.count > 0) {
  console.log(`Destination database already has ${existingCount.count} albums.`)
  console.log('Skipping migration to avoid duplicates.')
  console.log('To re-migrate, delete data/music.db and run again.')
  process.exit(0)
}

// Read all albums from source
interface SourceAlbum {
  id: number
  rank: number
  title: string
  artist: string
  year: number | null
  last_played: string | null
}

const sourceAlbums = sourceDb.prepare(`
  SELECT id, rank, title, artist, year, last_played
  FROM albums
  ORDER BY rank
`).all() as SourceAlbum[]

console.log(`Found ${sourceAlbums.length} albums in source database`)

// Insert into destination
const insert = destDb.prepare(`
  INSERT INTO favorites (rank, title, artist, year, last_played)
  VALUES (?, ?, ?, ?, ?)
`)

const insertMany = destDb.transaction((albums: SourceAlbum[]) => {
  for (const album of albums) {
    // Convert datetime to date string (extract YYYY-MM-DD from YYYY-MM-DD HH:MM:SS)
    const lastPlayed = album.last_played
      ? album.last_played.split(' ')[0]
      : null

    insert.run(album.rank, album.title, album.artist, album.year, lastPlayed)
  }
})

insertMany(sourceAlbums)

// Verify
const destCount = destDb.prepare('SELECT COUNT(*) as count FROM favorites').get() as { count: number }
console.log(`Successfully migrated ${destCount.count} albums`)

// Close databases
sourceDb.close()
destDb.close()
