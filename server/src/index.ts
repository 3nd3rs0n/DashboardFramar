import { buildApp } from './app.js';

try {
  process.loadEnvFile();
} catch {
  // .env is optional; env vars may come from the environment
}

const app = await buildApp();
const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: '0.0.0.0' });
