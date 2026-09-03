import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    // vitest collects unit tests only; Playwright specs live in e2e/ and run via `npm run e2e`
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
