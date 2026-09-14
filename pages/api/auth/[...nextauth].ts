// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitchProvider from 'next-auth/providers/twitch';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import '@/lib/env'; // Validate environment variables

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID as string,
      clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
      authorization: {
        params: {
          // channel:read:subscriptions is what /helix/subscriptions needs.
          // Without it that call 401s forever, so the subscriber half of
          // stream-stats sync could never work no matter how healthy the
          // token was. Changing this does NOT re-prompt existing users:
          // scopes are fixed at consent time, so anyone who signed in
          // before must sign out and back in to be re-asked.
          scope:
            'openid user:read:email moderator:read:followers channel:read:subscriptions',
        },
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
    // NOTE: there is deliberately no `jwt` callback. Configuring an adapter
    // selects database sessions, so NextAuth never invokes it. A previous
    // version used one to copy the Twitch access token onto the session, which
    // silently never ran and left follow monitoring dead. Read the token from
    // the Account row instead - see pages/api/twitch/connect-chat.ts.
  },
  pages: {
    signIn: '/',
  },
};

export default NextAuth(authOptions);
