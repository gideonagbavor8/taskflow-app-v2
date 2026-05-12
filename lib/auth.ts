import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user) {
            throw new Error('UserNotFound')
          }

          if (!user.password) {
            throw new Error('UseGoogleLogin')
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password)

          if (!isValid) {
            throw new Error('InvalidPassword')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === 'google') {
        try {
          if (user.email) {
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            })

            if (!existingUser) {
              const newUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name || null,
                  image: user.image || null,
                  emailVerified: new Date(),
                  lastLogin: new Date(),
                },
              })
              // Create default workspace for new user
              await prisma.workspace.create({
                data: {
                  name: `${user.name || 'Personal'}'s Workspace`,
                  members: {
                    create: {
                      userId: newUser.id,
                      role: 'ADMIN',
                    }
                  }
                }
              })
            } else {
              await prisma.user.update({
                where: { email: user.email },
                data: {
                  image: user.image || existingUser.image,
                  lastLogin: new Date(),
                },
              })
            }
          }
        } catch (error) {
          console.error('GOOGLE AUTH ERROR:', error)
          return false
        }
      } else if (account?.provider === 'credentials') {
        if (user.email) {
          try {
            await prisma.user.update({
              where: { email: user.email },
              data: { lastLogin: new Date() },
            })
          } catch (error) {
            console.error('CREDENTIALS LOGIN TRACKING ERROR:', error)
          }
        }
      }
      return true
    },
    async session({ session }: any) {
      if (session.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            workspaceMembers: {
              include: { workspace: true },
              take: 1, // Get the first workspace as default
            }
          }
        })
        if (user) {
          session.user.id = user.id
          session.user.workspaceId = user.workspaceMembers[0]?.workspaceId || null
          session.user.workspaceName = user.workspaceMembers[0]?.workspace?.name || null
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: true,
  trustHost: true,
})

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
