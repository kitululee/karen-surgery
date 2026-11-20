import { config } from "./config.js";
import { buildApp } from "./app.js";

async function start() {
  const app = await buildApp({ logger: true });
  await app.listen({ port: config.port, host: config.host });
  console.log(`[api] Karen Surgery API running at http://${config.host}:${config.port}`);
}

start().catch((err) => {
  console.error("[api] Failed to start:", err);
  process.exit(1);
});
