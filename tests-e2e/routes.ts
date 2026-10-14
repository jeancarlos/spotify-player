import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

const FIXTURES = join(process.cwd(), 'src', 'mocks', 'fixtures', 'deezer')
const SILENT_MP3 = readFileSync(join(process.cwd(), 'tests-e2e', 'fixtures', 'silent.mp3'))
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)
const NO_RESULTS_QUERY = 'zzz-no-results'

const FIXTURE_ROUTES: [RegExp, string][] = [
  [/^search$/, 'search-track'],
  [/^search\/artist$/, 'search-artist'],
  [/^search\/album$/, 'search-album'],
  [/^search\/playlist$/, 'search-playlist'],
  [/^artist\/\d+$/, 'artist'],
  [/^artist\/\d+\/top$/, 'artist-top'],
  [/^artist\/\d+\/albums$/, 'artist-albums'],
  [/^album\/\d+$/, 'album'],
  [/^album\/\d+\/tracks$/, 'album-tracks'],
  [/^playlist\/\d+$/, 'playlist'],
  [/^playlist\/\d+\/tracks$/, 'playlist-tracks'],
  [/^track\/\d+$/, 'track'],
  [/^chart\/0\/artists$/, 'chart-artists'],
  [/^chart\/0\/albums$/, 'chart-albums'],
  [/^chart\/0\/playlists$/, 'chart-playlists'],
  [/^chart\/0\/tracks$/, 'artist-top'],
]

const jsonp = (callback: string, body: string) => `${callback}(${body})`

const WIKI_SUMMARY = {
  extract: 'Coldplay are a British rock band formed in London in 1997.',
  content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Coldplay' } },
}

export async function setupRoutes(page: Page): Promise<string[]> {
  const unexpected: string[] = []
  await page.route(
    (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      unexpected.push(route.request().url())
      return route.abort()
    }
  )

  await page.route('https://api.deezer.com/**', async (route) => {
    const request = route.request()
    if (request.resourceType() === 'image') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG })
    }
    const url = new URL(request.url())
    const callback = url.searchParams.get('callback') ?? 'callback'
    const respond = (body: string) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: jsonp(callback, body) })

    const path = url.pathname.slice(1)
    const match = FIXTURE_ROUTES.find(([pattern]) => pattern.test(path))
    if (!match) {
      return respond('{"error":{"type":"DataException","message":"no data","code":800}}')
    }
    if (url.searchParams.get('q') === NO_RESULTS_QUERY) {
      return respond('{"data":[],"total":0}')
    }
    return respond(readFileSync(join(FIXTURES, `${match[1]}.json`), 'utf-8'))
  })

  await page.route('https://cdn-images.dzcdn.net/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG })
  )

  await page.route('https://cdnt-preview.dzcdn.net/**', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: SILENT_MP3 })
  )

  await page.route('https://*.wikipedia.org/**', (route) => {
    const url = new URL(route.request().url())
    const body = url.pathname.includes('/rest_v1/')
      ? WIKI_SUMMARY
      : ['Coldplay', ['Coldplay'], [''], ['']]
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })

  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  )

  await page.route('https://lrclib.net/**', (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
  )

  return unexpected
}

export { NO_RESULTS_QUERY }
