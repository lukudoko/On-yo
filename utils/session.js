// utils/session.js
import { PrismaClient } from "@prisma/client"
import { randomBytes } from "crypto"

const prisma = new PrismaClient()

// Create a simple session (you could also just use the JWT from Auth.js directly)
export async function createSession(userId) {
  const sessionToken = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  
  await prisma.session.create({
    data: {
      id: sessionToken,
      userId: userId,
      expires: expires
    }
  })
  
  return { sessionToken, expires }
}

export async function getSession(sessionToken) {
  const session = await prisma.session.findUnique({
    where: { id: sessionToken },
    include: { user: true }
  })
  
  if (!session || session.expires < new Date()) {
    return null
  }
  
  return session
}

export async function deleteSession(sessionToken) {
  await prisma.session.delete({
    where: { id: sessionToken }
  })
}