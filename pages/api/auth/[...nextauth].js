import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add the user ID to the session
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async signIn({ user, account, profile }) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: { id: user.id }
        })
        return true
      } catch (error) {
        console.error('Error creating user:', error)
        return false
      }
    }
  },
  // Don't use the adapter - handle storage ourselves
  // adapter: PrismaAdapter(prisma), // REMOVE this line
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)