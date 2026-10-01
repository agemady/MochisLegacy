import { existsSync } from 'node:fs';
import { chromium, defineConfig, devices } from '@playwright/test';

// Sandboxes that preinstall an older Chromium (and forbid `playwright install`)
// fall back to it; CI installs Playwright's own build, so this is a no-op there.
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium';
const launchOptions =
  !existsSync(chromium.executablePath()) && existsSync(LOCAL_CHROMIUM) ? { executablePath: LOCAL_CHROMIUM } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    ...devices['Desktop Chrome'],
    launchOptions,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions } }],
  webServer: {
    // Dev server (not preview): with Supabase unset, src/lib runs the in-memory
    // demo world only outside production builds.
    command: 'npm run dev -- --port 4175 --host 127.0.0.1',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
