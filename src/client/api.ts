export interface Favorite {
  id: number
  rank: number
  title: string
  artist: string
  year: number
  last_played: string | null
  play_count: number
}

const API_BASE = '/api'

export async function getFavorites(): Promise<Favorite[]> {
  const res = await fetch(`${API_BASE}/favorites`)
  return res.json()
}

export async function getFavoritesRecent(order: 'asc' | 'desc' = 'desc'): Promise<Favorite[]> {
  const res = await fetch(`${API_BASE}/favorites/recent?order=${order}`)
  return res.json()
}

export async function getFavoritesMostPlayed(): Promise<Favorite[]> {
  const res = await fetch(`${API_BASE}/favorites/most-played`)
  return res.json()
}

export async function getMaxRank(): Promise<number> {
  const res = await fetch(`${API_BASE}/favorites/max-rank`)
  const data = await res.json()
  return data.maxRank
}

export async function addFavorite(data: {
  rank: number
  title: string
  artist: string
  year: number
  last_played?: string
  play_count?: number
}): Promise<Favorite> {
  const res = await fetch(`${API_BASE}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateFavorite(
  id: number,
  data: Partial<Omit<Favorite, 'id'>>
): Promise<Favorite> {
  const res = await fetch(`${API_BASE}/favorites/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteFavorite(id: number): Promise<void> {
  await fetch(`${API_BASE}/favorites/${id}`, { method: 'DELETE' })
}

export async function moveToEnd(id: number): Promise<Favorite> {
  const res = await fetch(`${API_BASE}/favorites/${id}/move-to-end`, {
    method: 'POST'
  })
  return res.json()
}

export async function markPlayed(id: number): Promise<Favorite> {
  const res = await fetch(`${API_BASE}/favorites/${id}/played`, {
    method: 'POST'
  })
  return res.json()
}
