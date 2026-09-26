import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref || !token) throw new Error('Configura SUPABASE_PROJECT_REF y SUPABASE_ACCESS_TOKEN en .env.local.');
async function sql(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }), signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Supabase SQL (${response.status}): ${JSON.stringify(result)}`);
  return result;
}
const [command, file] = process.argv.slice(2);
if (command === 'query') {
  if (!file) throw new Error('Indica un archivo SQL. No imprimir secretos desde las consultas.');
  console.log(JSON.stringify(await sql(await readFile(file, 'utf8'))));
} else if (command === 'migrate') {
  await sql(`create schema if not exists private;
    create table if not exists private.agrosignal_migrations (
      version text primary key, checksum text not null, aplicado_en timestamptz not null default now());
    revoke all on private.agrosignal_migrations from public, anon, authenticated;`);
  const applied = await sql('select version, checksum from private.agrosignal_migrations');
  for (const name of (await readdir('supabase/migrations')).filter(n => n.endsWith('.sql')).sort()) {
    const source = await readFile(`supabase/migrations/${name}`, 'utf8');
    const checksum = createHash('sha256').update(source).digest('hex');
    const previous = applied.find(row => row.version === name);
    if (previous) {
      if (previous.checksum !== checksum) throw new Error(`No modificar una migración ya aplicada: ${name}`);
      console.log(`Ya aplicada: ${name}`); continue;
    }
    if (!/^[a-zA-Z0-9_]+\.sql$/.test(name) || !/commit;\s*$/i.test(source)) {
      throw new Error(`Migración sin transacción o nombre inválido: ${name}`);
    }
    await sql(source.replace(/commit;\s*$/i,
      `insert into private.agrosignal_migrations(version,checksum) values ('${name}','${checksum}');\ncommit;`));
    console.log(`Aplicada: ${name}`);
  }
} else {
  throw new Error('Uso: node --env-file=.env.local scripts/supabase-management.mjs migrate|query archivo.sql');
}
