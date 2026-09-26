import 'server-only'
import { headers } from 'next/headers'

export async function getSiteUrl() {
  const requestHeaders = await headers()
  const host = requestHeaders.get('host') ?? ''
  if (/^(localhost|127\.0\.0\.1):\d+$/.test(host)) return `http://${host}`
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return new URL(configured).origin
  return 'https://agrosignal.vercel.app'
}
