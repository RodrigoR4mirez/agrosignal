#!/usr/bin/env node
// Regenera SUPABASE_ACCESS_TOKEN desde la API de Supabase.
// Uso: node scripts/renovar-supabase-token.mjs
// El token nuevo se guarda en .env.local automáticamente.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

// Lee las variables actuales
const envContent = fs.readFileSync(envPath, 'utf8')
const match = envContent.match(/SUPABASE_PROJECT_REF=([^\n]+)/)
const projectRef = match ? match[1].trim() : null

if (!projectRef) {
  console.error('✘ No se encontró SUPABASE_PROJECT_REF en .env.local')
  process.exit(1)
}

const h = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
}

if (!h.Authorization.includes('.')) {
  console.error('✘ SUPABASE_SERVICE_ROLE_KEY no está en .env.local o está vacío')
  console.error('   Solución: ejecuta esto en una sesión donde .env.local esté cargado')
  process.exit(1)
}

try {
  console.log('Generando SUPABASE_ACCESS_TOKEN nuevo...')
  const r = await fetch(`https://api.supabase.com/v1/auth/admin/generate_token`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ iss: 'supabase', sub: 'service_role', aud: 'authenticated', role: 'service_role', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
  })
  const res = await r.json()
  if (!r.ok) throw new Error(res.message || res.error_description || JSON.stringify(res))

  const token = res.access_token || res.token
  if (!token) throw new Error('No se recibió token en la respuesta')

  // Reemplaza el token en .env.local
  const newEnv = envContent.replace(
    /SUPABASE_ACCESS_TOKEN=.*/,
    `SUPABASE_ACCESS_TOKEN=${token}`
  )
  fs.writeFileSync(envPath, newEnv)
  console.log('✔ Token regenerado y guardado en .env.local')
} catch (err) {
  // Fallback: usar el endpoint de Supabase Management API directamente
  try {
    console.log('Intento alternativo: usar Management API...')
    const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-tokens`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ name: `agrosignal-token-${Date.now()}` })
    })
    const res = await r.json()
    if (!r.ok) throw new Error(res.message || JSON.stringify(res))

    const token = res.access_token || res.api_token
    if (!token) throw new Error('No se recibió token en la respuesta')

    const newEnv = envContent.replace(
      /SUPABASE_ACCESS_TOKEN=.*/,
      `SUPABASE_ACCESS_TOKEN=${token}`
    )
    fs.writeFileSync(envPath, newEnv)
    console.log('✔ Token regenerado y guardado en .env.local (Management API)')
  } catch (e) {
    console.error('✘ Error al regenerar el token:', err.message)
    console.error('   Opción manual: supabase.com/dashboard/account/tokens → Generate new token')
    process.exit(1)
  }
}
