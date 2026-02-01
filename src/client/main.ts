import {
  Favorite,
  getFavorites,
  getFavoritesRecent,
  getMaxRank,
  addFavorite,
  updateFavorite,
  deleteFavorite,
  markPlayed
} from './api'

// DOM Elements
const favoritesBody = document.getElementById('favorites-body') as HTMLTableSectionElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const viewRankBtn = document.getElementById('view-rank') as HTMLButtonElement
const viewRecentBtn = document.getElementById('view-recent') as HTMLButtonElement

const modal = document.getElementById('modal') as HTMLDivElement
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement
const albumForm = document.getElementById('album-form') as HTMLFormElement
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement

const formId = document.getElementById('form-id') as HTMLInputElement
const formRank = document.getElementById('form-rank') as HTMLInputElement
const formTitle = document.getElementById('form-title') as HTMLInputElement
const formArtist = document.getElementById('form-artist') as HTMLInputElement
const formYear = document.getElementById('form-year') as HTMLInputElement
const formLastPlayed = document.getElementById('form-last-played') as HTMLInputElement

const deleteModal = document.getElementById('delete-modal') as HTMLDivElement
const deleteMessage = document.getElementById('delete-message') as HTMLParagraphElement
const deleteCancelBtn = document.getElementById('delete-cancel') as HTMLButtonElement
const deleteConfirmBtn = document.getElementById('delete-confirm') as HTMLButtonElement

// State
let currentView: 'rank' | 'recent' = 'rank'
let deleteTargetId: number | null = null

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Render favorites table
function renderFavorites(favorites: Favorite[]): void {
  favoritesBody.innerHTML = favorites.map(f => `
    <tr data-id="${f.id}">
      <td>${f.rank}</td>
      <td>${escapeHtml(f.title)}</td>
      <td>${escapeHtml(f.artist)}</td>
      <td>${f.year ?? '-'}</td>
      <td>${formatDate(f.last_played)}</td>
      <td class="actions">
        <button class="btn btn-small played-btn" data-id="${f.id}">Played</button>
        <button class="btn btn-small edit-btn" data-id="${f.id}">Edit</button>
        <button class="btn btn-small delete-btn" data-id="${f.id}">Delete</button>
      </td>
    </tr>
  `).join('')
}

// Escape HTML to prevent XSS
function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// Load and render favorites
async function loadFavorites(): Promise<void> {
  try {
    const favorites = currentView === 'rank'
      ? await getFavorites()
      : await getFavoritesRecent()
    console.log('Loaded favorites:', favorites.length)
    renderFavorites(favorites)
  } catch (error) {
    console.error('Failed to load favorites:', error)
  }
}

// Open modal for adding
async function openAddModal(): Promise<void> {
  modalTitle.textContent = 'Add Album'
  formId.value = ''
  formTitle.value = ''
  formArtist.value = ''
  formYear.value = ''
  formLastPlayed.value = ''

  // Suggest next rank
  const maxRank = await getMaxRank()
  formRank.value = String(maxRank + 1)

  modal.classList.remove('hidden')
  formTitle.focus()
}

// Open modal for editing
function openEditModal(favorite: Favorite): void {
  modalTitle.textContent = 'Edit Album'
  formId.value = String(favorite.id)
  formRank.value = String(favorite.rank)
  formTitle.value = favorite.title
  formArtist.value = favorite.artist
  formYear.value = favorite.year ? String(favorite.year) : ''
  formLastPlayed.value = favorite.last_played ?? ''

  modal.classList.remove('hidden')
  formTitle.focus()
}

// Close modal
function closeModal(): void {
  modal.classList.add('hidden')
  albumForm.reset()
}

// Handle form submit
async function handleFormSubmit(e: Event): Promise<void> {
  e.preventDefault()

  const data = {
    rank: parseInt(formRank.value),
    title: formTitle.value.trim(),
    artist: formArtist.value.trim(),
    year: formYear.value ? parseInt(formYear.value) : undefined,
    last_played: formLastPlayed.value || undefined
  }

  const id = formId.value

  if (id) {
    await updateFavorite(parseInt(id), data)
  } else {
    await addFavorite(data)
  }

  closeModal()
  await loadFavorites()
}

// Open delete confirmation
function openDeleteModal(favorite: Favorite): void {
  deleteTargetId = favorite.id
  deleteMessage.textContent = `Are you sure you want to delete "${favorite.title}" by ${favorite.artist}?`
  deleteModal.classList.remove('hidden')
}

// Close delete modal
function closeDeleteModal(): void {
  deleteModal.classList.add('hidden')
  deleteTargetId = null
}

// Confirm delete
async function confirmDelete(): Promise<void> {
  if (deleteTargetId !== null) {
    await deleteFavorite(deleteTargetId)
    closeDeleteModal()
    await loadFavorites()
  }
}

// Handle table click events (edit, delete, played)
async function handleTableClick(e: Event): Promise<void> {
  const target = e.target as HTMLElement
  if (!target.matches('button')) return

  const id = parseInt(target.dataset.id ?? '')
  if (!id) return

  // Find the favorite in the current data
  const favorites = currentView === 'rank'
    ? await getFavorites()
    : await getFavoritesRecent()
  const favorite = favorites.find(f => f.id === id)
  if (!favorite) return

  if (target.classList.contains('edit-btn')) {
    openEditModal(favorite)
  } else if (target.classList.contains('delete-btn')) {
    openDeleteModal(favorite)
  } else if (target.classList.contains('played-btn')) {
    await markPlayed(id)
    await loadFavorites()
  }
}

// Switch view
function setView(view: 'rank' | 'recent'): void {
  currentView = view
  viewRankBtn.classList.toggle('active', view === 'rank')
  viewRecentBtn.classList.toggle('active', view === 'recent')
  loadFavorites()
}

// Event listeners
addBtn.addEventListener('click', openAddModal)
cancelBtn.addEventListener('click', closeModal)
albumForm.addEventListener('submit', handleFormSubmit)
favoritesBody.addEventListener('click', handleTableClick)
viewRankBtn.addEventListener('click', () => setView('rank'))
viewRecentBtn.addEventListener('click', () => setView('recent'))
deleteCancelBtn.addEventListener('click', closeDeleteModal)
deleteConfirmBtn.addEventListener('click', confirmDelete)

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal()
    closeDeleteModal()
  }
})

// Close modal on backdrop click
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal()
})
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal()
})

// Initial load
loadFavorites()
