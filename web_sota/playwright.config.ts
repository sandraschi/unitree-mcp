import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 60000,
    retries: 1,
    use: {
        baseURL: 'http://localhost:11053',
        headless: true,
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'C:\\Users\\sandr\\.local\\bin\\uv.exe run uvicorn web_sota.backend.server:app --host 127.0.0.1 --port 11052 --log-level warning',
        port: 11052,
        cwd: '../',
        timeout: 30000,
        reuseExistingServer: false,
    },
});
