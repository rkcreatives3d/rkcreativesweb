import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the built static site (./out).
//   npm run build && npm test        (or: npm run check)
export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  fullyParallel: true,
  // each test drives real 3D pages; too many at once starves the CPU
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve.mjs 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
