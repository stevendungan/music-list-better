import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  getAllFavorites,
  getFavoritesByRecent,
  getFavoriteById,
  addFavorite,
  updateFavorite,
  deleteFavorite,
  markPlayed,
  getMaxRank
} from './db.js'

const app = new Hono()

// Enable CORS for development
app.use('/api/*', cors())

// GET /api/favorites - List all favorites sorted by rank
app.get('/api/favorites', (c) => {
  const favorites = getAllFavorites()
  return c.json(favorites)
})

// GET /api/favorites/recent - List favorites sorted by last_played
app.get('/api/favorites/recent', (c) => {
  const favorites = getFavoritesByRecent()
  return c.json(favorites)
})

// GET /api/favorites/max-rank - Get the current max rank
app.get('/api/favorites/max-rank', (c) => {
  const maxRank = getMaxRank()
  return c.json({ maxRank })
})

// GET /api/favorites/:id - Get a single favorite
app.get('/api/favorites/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const favorite = getFavoriteById(id)
  if (!favorite) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json(favorite)
})

// POST /api/favorites - Add a new favorite
app.post('/api/favorites', async (c) => {
  const body = await c.req.json()
  const { rank, title, artist, year, last_played } = body

  if (!rank || !title || !artist || year === undefined || year === null) {
    return c.json({ error: 'rank, title, artist, and year are required' }, 400)
  }

  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    return c.json({ error: 'year must be a 4-digit integer' }, 400)
  }

  const favorite = addFavorite({ rank, title, artist, year, last_played })
  return c.json(favorite, 201)
})

// PUT /api/favorites/:id - Update a favorite
app.put('/api/favorites/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()

  if (body.year !== undefined) {
    if (!Number.isInteger(body.year) || body.year < 1000 || body.year > 9999) {
      return c.json({ error: 'year must be a 4-digit integer' }, 400)
    }
  }

  const favorite = updateFavorite(id, body)
  if (!favorite) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json(favorite)
})

// DELETE /api/favorites/:id - Delete a favorite
app.delete('/api/favorites/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const success = deleteFavorite(id)
  if (!success) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json({ success: true })
})

// POST /api/favorites/:id/played - Mark as played today
app.post('/api/favorites/:id/played', (c) => {
  const id = parseInt(c.req.param('id'))
  const favorite = markPlayed(id)
  if (!favorite) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json(favorite)
})

const port = 3000
console.log(`Server running at http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
