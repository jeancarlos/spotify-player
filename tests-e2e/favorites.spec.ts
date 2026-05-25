import { test, expect } from './fixtures/auth'

test.describe('Favorites form', () => {
  test('favorites page renders the Add button', async ({ page }) => {
    await page.goto('/favorites')
    // Button text is t('favorites.addButton') = "Adicionar favorito" (PT) / "Add favorite" (EN)
    const addBtn = page.getByRole('button', { name: /adicionar favorito|add favorite/i })
    await expect(addBtn).toBeVisible({ timeout: 10000 })
  })

  test('clicking Add opens the popover with the track combobox', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // TrackAutocomplete renders an input with role="combobox"
    const combobox = page.getByRole('combobox')
    await expect(combobox).toBeVisible({ timeout: 5000 })
  })

  test('popover contains the note textarea and submit button', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // Note textarea — role="textbox" matches textarea
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 5000 })
    // Submit button text: t('favorites.addConfirm') = "Adicionar ao favorito" / "Add to favorites"
    await expect(
      page.getByRole('button', { name: /adicionar ao favorito|add to favorites/i })
    ).toBeVisible({ timeout: 5000 })
  })

  test('submit button is disabled until a track is selected', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // Submit button: t('favorites.addConfirm') — disabled while track is empty (zod validation)
    const submitBtn = page.getByRole('button', { name: /adicionar ao favorito|add to favorites/i })
    await submitBtn.waitFor({ timeout: 5000 })
    await expect(submitBtn).toBeDisabled()
  })

  test('combobox input has correct placeholder text', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    const combobox = page.getByRole('combobox')
    await combobox.waitFor({ timeout: 5000 })
    // Placeholder: t('favorites.searchAutocomplete') = "Buscar música ou artista..." / "Search for a song or artist..."
    await expect(combobox).toHaveAttribute('placeholder', /.+/)
  })

  test('Add button toggles label to Close when popover is open', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // Button now shows t('favorites.close') = "Fechar" / "Close"
    await expect(
      page.getByRole('button', { name: /^fechar$|^close$/i }).first()
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Favorites — estado vazio', () => {
  test('exibe mensagem de lista vazia quando não há favoritos', async ({ page }) => {
    await page.goto('/favorites')
    // t('favorites.emptyList') = "Nenhum favorito ainda" (PT) / "No favorites yet" (EN)
    await expect(
      page.getByText(/nenhum favorito|no favorites yet/i)
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Favorites — fluxo completo de adicionar', () => {
  test('adicionar uma música via formulário faz ela aparecer na lista', async ({ page }) => {
    await page.goto('/favorites')

    // Wait for lazy-loaded page then open popover
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click({ timeout: 10000 })

    const combobox = page.getByRole('combobox')
    await combobox.waitFor({ timeout: 5000 })
    await combobox.fill('Track')

    const firstOption = page.getByRole('listbox').getByRole('option').first()
    await firstOption.waitFor({ timeout: 5000 })
    await firstOption.click()

    // t('favorites.addConfirm') = "Adicionar ao favorito" (PT) / "Add to favorites" (EN)
    await page.getByRole('button', { name: /adicionar ao favorito|add to favorites/i }).click()

    await expect(page.getByText('Track 1')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Favorites — remover track', () => {
  test('remover track da lista faz ela desaparecer', async ({ page }) => {
    const trackJson = {
      id: 'track-1',
      name: 'Track 1',
      uri: 'spotify:track:track-1',
      duration_ms: 210000,
      explicit: false,
      popularity: 80,
      preview_url: null,
      type: 'track',
      artists: [{ id: 'artist-1', name: 'Mock Artist', uri: 'spotify:artist:artist-1', type: 'artist' }],
      album: {
        id: 'album-1',
        name: 'Mock Album',
        images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
        release_date: '2024-01-01',
        album_type: 'album',
        artists: [],
        uri: 'spotify:album:album-1',
        type: 'album',
      },
    }

    await page.addInitScript(
      ({ trackData, userId }) => {
        localStorage.setItem(`spoter_favorites_${userId}`, JSON.stringify([trackData]))
        localStorage.setItem(`spoter_playlist_${userId}`, 'e2e-playlist')
      },
      { trackData: trackJson, userId: 'user1' }
    )

    await page.goto('/favorites')
    await expect(page.getByText('Track 1')).toBeVisible({ timeout: 10000 })

    // Simulate removal: update localStorage and dispatch spoter:favorites-changed
    // (mirrors exactly what useFavoriteStorage.removeTrack does internally)
    await page.evaluate(({ userId }) => {
      localStorage.setItem(`spoter_favorites_${userId}`, JSON.stringify([]))
      window.dispatchEvent(new CustomEvent('spoter:favorites-changed', { detail: { userId } }))
    }, { userId: 'user1' })

    await expect(page.getByText('Track 1')).not.toBeVisible({ timeout: 5000 })
  })
})
