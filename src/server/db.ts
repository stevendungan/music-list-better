import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '../../data/music.db')

const db = new Database(dbPath)

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rank INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    year INTEGER,
    last_played TEXT
  )
`)

export interface Favorite {
  id: number
  rank: number
  title: string
  artist: string
  year: number | null
  last_played: string | null
}

export function getAllFavorites(): Favorite[] {
  return db.prepare('SELECT * FROM favorites ORDER BY rank').all() as Favorite[]
}

export function getFavoritesByRecent(): Favorite[] {
  return db.prepare(`
    SELECT * FROM favorites
    ORDER BY last_played DESC NULLS LAST, rank
  `).all() as Favorite[]
}

export function getFavoriteById(id: number): Favorite | undefined {
  return db.prepare('SELECT * FROM favorites WHERE id = ?').get(id) as Favorite | undefined
}

export function addFavorite(data: { rank: number; title: string; artist: string; year?: number; last_played?: string }): Favorite {
  // Shift ranks down for albums at or below the new rank
  db.prepare('UPDATE favorites SET rank = rank + 1 WHERE rank >= ?').run(data.rank)

  const result = db.prepare(`
    INSERT INTO favorites (rank, title, artist, year, last_played)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.rank, data.title, data.artist, data.year ?? null, data.last_played ?? null)

  return getFavoriteById(result.lastInsertRowid as number)!
}

export function updateFavorite(id: number, data: { rank?: number; title?: string; artist?: string; year?: number | null; last_played?: string | null }): Favorite | undefined {
  const current = getFavoriteById(id)
  if (!current) return undefined

  // Handle rank change - use transaction to avoid UNIQUE constraint issues
  if (data.rank !== undefined && data.rank !== current.rank) {
    const transaction = db.transaction(() => {
      // First, temporarily move current album's rank out of the way
      db.prepare('UPDATE favorites SET rank = -1 WHERE id = ?').run(id)

      if (data.rank < current.rank) {
        // Moving up: shift albums in between down
        db.prepare('UPDATE favorites SET rank = rank + 1 WHERE rank >= ? AND rank < ?').run(data.rank, current.rank)
      } else {
        // Moving down: shift albums in between up
        db.prepare('UPDATE favorites SET rank = rank - 1 WHERE rank > ? AND rank <= ?').run(current.rank, data.rank)
      }

      // Now update the album with its new rank and other fields
      db.prepare(`
        UPDATE favorites
        SET rank = ?, title = ?, artist = ?, year = ?, last_played = ?
        WHERE id = ?
      `).run(
        data.rank,
        data.title ?? current.title,
        data.artist ?? current.artist,
        data.year !== undefined ? data.year : current.year,
        data.last_played !== undefined ? data.last_played : current.last_played,
        id
      )
    })
    transaction()
  } else {
    // No rank change, just update other fields
    db.prepare(`
      UPDATE favorites
      SET rank = ?, title = ?, artist = ?, year = ?, last_played = ?
      WHERE id = ?
    `).run(
      data.rank ?? current.rank,
      data.title ?? current.title,
      data.artist ?? current.artist,
      data.year !== undefined ? data.year : current.year,
      data.last_played !== undefined ? data.last_played : current.last_played,
      id
    )
  }

  return getFavoriteById(id)
}

export function deleteFavorite(id: number): boolean {
  const current = getFavoriteById(id)
  if (!current) return false

  db.prepare('DELETE FROM favorites WHERE id = ?').run(id)

  // Shift ranks up for albums below the deleted one
  db.prepare('UPDATE favorites SET rank = rank - 1 WHERE rank > ?').run(current.rank)

  return true
}

export function markPlayed(id: number): Favorite | undefined {
  const today = new Date().toISOString().split('T')[0]
  db.prepare('UPDATE favorites SET last_played = ? WHERE id = ?').run(today, id)
  return getFavoriteById(id)
}

export function getMaxRank(): number {
  const result = db.prepare('SELECT MAX(rank) as maxRank FROM favorites').get() as { maxRank: number | null }
  return result.maxRank ?? 0
}

export default db
