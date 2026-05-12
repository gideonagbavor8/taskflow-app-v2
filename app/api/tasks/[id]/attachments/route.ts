import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: taskId } = await params
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { workspace: { include: { members: true } } }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const isMember = task.workspace?.members.some(m => m.userId === user.id)
    if (task.userId !== user.id && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${taskId}/${Date.now()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('task-attachments')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 })
    }

    // Get Public URL
    const { data: urlData } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(fileName)

    // Save to Prisma
    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      }
    })

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: taskId } = await params

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
