import GitHubProviderImport from "next-auth/providers/github"
import GoogleProviderImport from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

const GitHubProvider = GitHubProviderImport.default ?? GitHubProviderImport
const GoogleProvider = GoogleProviderImport.default ?? GoogleProviderImport

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
    async signIn({ user }) {
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
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
