import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password')
        }

        const provider = await prisma.provider.findUnique({
          where: { email: credentials.email },
        })

        if (!provider) {
          throw new Error('No account found with this email')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          provider.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: provider.id,
          username: provider.username,
          email: provider.email,
          name: provider.fullName,
          image: provider.avatarUrl || undefined,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
      }
      // Backfill username for existing sessions that don't have it
      if (!token.username && token.id) {
        try {
          const provider = await prisma.provider.findUnique({
            where: { id: token.id as string },
            select: { username: true },
          })
          token.username = provider?.username ?? ''
        } catch {
          // DB unavailable — keep token valid, username will be empty
          token.username = ''
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    },
  },
}
