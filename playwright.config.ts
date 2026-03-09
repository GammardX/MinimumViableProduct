import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './system_test/tests',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173/MinimumViableProduct/',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true
  },
  webServer: [
    {
      command: 'node system_test/mock-llm-provider.cjs',
      url: 'http://127.0.0.1:18080/health',
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command:
        'cd backend && LLM_FALLBACK_ORDER=LOCAL LOCAL_URL=http://127.0.0.1:18080/v1/chat/completions LOCAL_MODEL=test-model ALLOWED_ORIGINS=http://127.0.0.1:5173 /home/intmainale/Desktop/MinimumViableProduct/.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000',
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: 'npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173/MinimumViableProduct/',
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
});
