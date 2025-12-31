import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth'

// GET /api/tasks - Get all tasks for authenticated user
export async function GET() {
  try {
    const user = await requireAuth()
    
    const userRecord = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: userRecord.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const userRecord = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        status: validatedData.status || 'TODO',
        priority: validatedData.priority || 'MEDIUM',
        dueDate: validatedData.dueDate && validatedData.dueDate.trim() !== '' 
          ? new Date(validatedData.dueDate) 
          : null,
        userId: userRecord.id,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

