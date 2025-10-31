// lib/env.ts
/**
 * Environment variable validation
 * This ensures all required environment variables are present at build/runtime
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
] as const;

const optionalEnvVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`
    );
  }

  // Warn about missing optional variables
  const missingOptional: string[] = [];
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      missingOptional.push(envVar);
    }
  }

  if (missingOptional.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `Optional environment variables not set:\n${missingOptional.map(v => `  - ${v}`).join('\n')}\nSome features may not work.`
    );
  }
}

// Validate on module import
if (typeof window === 'undefined') {
  // Only validate on server side
  validateEnv();
}
