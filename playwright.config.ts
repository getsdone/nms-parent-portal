import { defineConfig, devices } from "@playwright/test";

// Tests change shared rows (a todo, an RSVP, the family city) and put them
// back, so they run one at a time against a single server and database.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4590",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "PORT=4590 npm run start",
    url: "http://localhost:4590/api/health",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
