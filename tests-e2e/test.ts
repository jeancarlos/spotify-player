import { test as base, expect } from '@playwright/test'
import { setupRoutes } from './routes'

export const test = base.extend({
  page: async ({ page }, use) => {
    const unexpected = await setupRoutes(page)
    await use(page)
    expect(unexpected, 'requests to hosts no route stubs').toEqual([])
  },
})

export { expect }
