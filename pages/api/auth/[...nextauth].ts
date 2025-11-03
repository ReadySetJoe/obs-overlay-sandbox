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
    session: async ({ session, user, token }) => {
      if (session?.user) {
        session.user.id = user.id;
        // Add access token to session for Twitch API calls
        if (token?.accessToken) {
          session.accessToken = token.accessToken as string;
        }
      }
      return session;
    },
    jwt: async ({ token, account }) => {
      // Store access token in JWT for later use
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/',
  },
};

export default NextAuth(authOptions);
