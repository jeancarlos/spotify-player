import { test as base, expect } from '@playwright/test'
import { setupRoutes } from './routes'

export const test = base.extend({
  page: async ({ page }, use) => {
    await setupRoutes(page)
    await use(page)
  },
})

export { expect }
