// lib/twitchToken.ts
import { prisma } from '@/lib/prisma';

/**
 * Twitch user access tokens are valid for about four hours. NextAuth records
 * `refresh_token` and `expires_at` on the Account row at sign-in, but until
 * this module existed nothing read either one - every caller pulled
 * `access_token` out of the database and used it forever. Features built on
 * it (stream stats sync, follow monitoring) therefore worked immediately
 * after signing in and then broke silently a few hours later, with signing
 * out and back in as the only known cure.
 *
 * Every Twitch API caller should go through getValidTwitchToken().
 */

/**
 * Refresh slightly early. A token that expires in ten seconds will very
 * likely be dead by the time the request lands.
 */
const EXPIRY_MARGIN_SECONDS = 60;

const REAUTH_HINT = 'Please sign out and sign in again to reconnect Twitch.';

export type TwitchTokenResult =
  | { ok: true; accessToken: string; broadcasterId: string }
  | { ok: false; status: number; error: string };

interface TwitchRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Exchange a refresh token for a new access token. Returns null on any
 * failure - a refresh token can be revoked by the user, invalidated by a
 * password change, or rejected if the app's scopes changed.
 */
async function refreshTwitchToken(
  refreshToken: string
): Promise<TwitchRefreshResponse | null> {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      console.error(
        'Twitch refused to refresh the token:',
        response.status,
        await response.text()
      );
      return null;
    }

    return (await response.json()) as TwitchRefreshResponse;
  } catch (error) {
    console.error('Error refreshing Twitch token:', error);
    return null;
  }
}

/**
 * Get a usable Twitch access token for a user, refreshing it first if the
 * stored one has expired.
 *
 * A null `expires_at` means "we do not know" - accounts linked before expiry
 * was recorded have one. Those are tried as-is rather than rejected, since
 * refusing a token that may be perfectly good would lock the user out of a
 * working feature to prevent a hypothetical failure.
 */
export async function getValidTwitchToken(
  userId: string
): Promise<TwitchTokenResult> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'twitch' },
  });

  if (!account?.access_token || !account.providerAccountId) {
    return {
      ok: false,
      status: 400,
      error: 'Twitch account not connected',
    };
  }

  const broadcasterId = account.providerAccountId;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isExpired =
    account.expires_at !== null &&
    account.expires_at - EXPIRY_MARGIN_SECONDS <= nowSeconds;

  if (!isExpired) {
    return { ok: true, accessToken: account.access_token, broadcasterId };
  }

  if (!account.refresh_token) {
    return {
      ok: false,
      status: 401,
      error: `Your Twitch access token has expired and no refresh token is stored. ${REAUTH_HINT}`,
    };
  }

  const refreshed = await refreshTwitchToken(account.refresh_token);

  if (!refreshed?.access_token) {
    return {
      ok: false,
      status: 401,
      error: `Your Twitch access token has expired and could not be refreshed. ${REAUTH_HINT}`,
    };
  }

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: refreshed.access_token,
      // Twitch rotates refresh tokens, so keep the new one when it sends one.
      // Overwriting with undefined would leave the old value in place, which
      // is the correct fallback when it does not.
      refresh_token: refreshed.refresh_token ?? account.refresh_token,
      expires_at: refreshed.expires_in
        ? nowSeconds + refreshed.expires_in
        : null,
    },
  });

  return { ok: true, accessToken: refreshed.access_token, broadcasterId };
}
