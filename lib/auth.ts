import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user?.email) {
    throw new Error('Unauthorized')
  }
  return user
}

