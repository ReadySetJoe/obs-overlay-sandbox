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
          scope: 'openid user:read:email moderator:read:followers',
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
