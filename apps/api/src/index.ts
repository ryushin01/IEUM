import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createDb, migrate } from './db.ts';

const config = loadConfig();
const db = await createDb(config);
await migrate(db);
if (process.env.SEED === '1') {
  if (process.env.NODE_ENV === 'production') throw new Error('운영 환경에서는 데모 데이터를 넣을 수 없습니다.');
  const { seed } = await import('./seed.ts');
  await seed(db, config);
}
const app = await buildApp(config, db);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    await db.close();
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: '0.0.0.0' });
