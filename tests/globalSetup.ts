import { execFileSync } from 'child_process'
import { resolve } from 'path'
import { config } from 'dotenv'

// ponytail: execFileSync avoids shell injection; args are hardcoded strings, not user input
export default async function setup() {
  // Load .env so TEST_DATABASE_URL is available in this process context
  config({ path: resolve(process.cwd(), '.env') })
  config({ path: resolve(process.cwd(), '.env.local'), override: true })

  console.log('[globalSetup] Syncing test database schema...')
  const testUrl = process.env.TEST_DATABASE_URL
  if (!testUrl) {
    console.log('[globalSetup] TEST_DATABASE_URL not set, skipping')
    return
  }

  const prisma = resolve(process.cwd(), 'node_modules/.bin/prisma')
  try {
    // --force-reset drops and recreates the test DB schema; safe for test-only databases
    execFileSync(prisma, ['db', 'push', '--skip-generate', '--force-reset'], {
      env: { ...process.env, DATABASE_URL: testUrl },
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('[globalSetup] Test DB schema synced.')
  } catch (e) {
    console.error('[globalSetup] Failed to sync test DB:', e)
    throw e
  }
}
