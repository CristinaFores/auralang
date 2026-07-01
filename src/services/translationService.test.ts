/** @jest-environment node */

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { translateText } from './translationService'

const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'

const server = setupServer(
  http.get(TRANSLATE_URL, ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('q') !== 'Hello world' || url.searchParams.get('tl') !== 'es') {
      return new HttpResponse(null, { status: 400 })
    }

    return HttpResponse.text(
      JSON.stringify([[['Hola mundo', 'Hello world', null, null, 1]]]),
      { headers: { 'content-type': 'application/json' } },
    )
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('translateText', () => {
  it('returns translated text when API responds successfully', async () => {
    await expect(translateText('Hello world', 'es')).resolves.toBe('Hola mundo')
  })

  it('returns empty string for empty input', async () => {
    await expect(translateText('   ', 'es')).resolves.toBe('')
  })

  it('throws when API returns non-ok status', async () => {
    server.use(
      http.get(TRANSLATE_URL, () => new HttpResponse(null, { status: 500 })),
    )

    await expect(translateText('Hello world', 'es')).rejects.toThrow('Translation failed: 500')
  })
})
