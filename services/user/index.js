import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function getUserId(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting user ID from session:', error);
    return null;
  }
}