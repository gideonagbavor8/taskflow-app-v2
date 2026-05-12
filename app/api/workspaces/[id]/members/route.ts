import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendInviteEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { email, role = 'MEMBER' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user is Admin of the workspace
    const adminMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: session.user.id
        }
      }
    })

    if (!adminMember || adminMember.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Find the user to invite and check their preferences
    const userToInvite = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        settings: true
      }
    })

    if (!userToInvite) {
      return NextResponse.json({ error: 'User not found. They must register first.' }, { status: 404 })
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: userToInvite.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 })
    }

    const newMember = await prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: id,
          userId: userToInvite.id,
          role: role as any
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          },
          workspace: {
            select: {
              name: true
            }
          }
        }
      })

      // Create notification for the invited user
      await tx.notification.create({
        data: {
          userId: userToInvite.id,
          title: "New Workspace Invitation",
          message: `You've been invited to join "${member.workspace.name}" by ${session.user.name || session.user.email}.`,
          type: "INVITE",
          link: "/dashboard" // Or a specific link to the workspace
        }
      })

      return member
    })

    // Send email notification if user preferences allow it
    const userSettings = userToInvite.settings as any
    if (userSettings?.emailNotifications !== false) {
      // Note: We don't await this to keep the API response fast (fire and forget)
      sendInviteEmail(
        userToInvite.email,
        (newMember as any).workspace.name,
        session.user.name || session.user.email || 'A teammate'
      )
    }

    return NextResponse.json(newMember)
  } catch (error) {
    console.error('Error inviting member:', error)
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is a member of the workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: session.user.id
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}
