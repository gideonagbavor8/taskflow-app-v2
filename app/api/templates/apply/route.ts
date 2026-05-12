import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { PROJECT_TEMPLATES } from '@/lib/templates'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const template = PROJECT_TEMPLATES.find(t => t.id === templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: 'Workspace ID not found in session' }, { status: 400 })
    }

    // Create multiple tasks in a transaction
    const tasks = await prisma.$transaction(
      template.tasks.map((task) => 
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            userId: user.id,
            workspaceId: user.workspaceId!
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: `Successfully applied ${template.name} template!`,
      count: tasks.length 
    })
  } catch (error: any) {
    console.error('Error applying template:', error)
    return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 })
  }
}
