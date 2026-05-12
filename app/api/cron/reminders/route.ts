import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Authorization check (For Vercel Cron or manual trigger with secret)
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const in30m = new Date(now.getTime() + 30 * 60 * 1000)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  try {
    // 1. Find High Priority tasks due in 30 mins
    const tasks30m = await prisma.task.findMany({
      where: {
        priority: 'HIGH',
        status: { not: 'DONE' },
        dueDate: {
          lte: in30m,
          gt: now
        },
        reminderSent30m: false
      },
      include: { user: true }
    })

    // 2. Find High Priority tasks due in 24 hours
    const tasks24h = await prisma.task.findMany({
      where: {
        priority: 'HIGH',
        status: { not: 'DONE' },
        dueDate: {
          lte: in24h,
          gt: new Date(now.getTime() + 23 * 60 * 60 * 1000) // Around 24h window
        },
        reminderSent24h: false
      },
      include: { user: true }
    })

    const results = { sent30m: 0, sent24h: 0 }

    // Send 30m reminders
    for (const task of tasks30m) {
      if (task.user?.email) {
        await resend.emails.send({
          from: 'TaskFlow <onboarding@resend.dev>', // Use verified domain in production
          to: task.user.email,
          subject: `🚨 URGENT: "${task.title}" is due in 30 minutes!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #0891b2;">TaskFlow Reminder</h2>
              <p>Hi ${task.user.name || 'there'},</p>
              <p>This is a high-priority reminder that your task <strong>"${task.title}"</strong> is due in approximately <strong>30 minutes</strong>.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Task:</strong> ${task.title}</p>
                <p style="margin: 5px 0 0 0;"><strong>Due at:</strong> ${new Date(task.dueDate!).toLocaleString()}</p>
              </div>
              <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; background: #0891b2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Task</a>
              <p style="font-size: 12px; color: #64748b; margin-top: 30px;">You are receiving this because you enabled high-priority email alerts.</p>
            </div>
          `
        })
        await prisma.task.update({
          where: { id: task.id },
          data: { reminderSent30m: true }
        })
        results.sent30m++
      }
    }

    // Send 24h reminders
    for (const task of tasks24h) {
      if (task.user?.email) {
        await resend.emails.send({
          from: 'TaskFlow <onboarding@resend.dev>',
          to: task.user.email,
          subject: `📅 Reminder: "${task.title}" is due tomorrow`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #0891b2;">TaskFlow Daily Alert</h2>
              <p>Hi ${task.user.name || 'there'},</p>
              <p>This is a high-priority reminder that your task <strong>"${task.title}"</strong> is due <strong>tomorrow</strong>.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Task:</strong> ${task.title}</p>
                <p style="margin: 5px 0 0 0;"><strong>Due at:</strong> ${new Date(task.dueDate!).toLocaleString()}</p>
              </div>
              <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; background: #0891b2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Task</a>
              <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Stay productive!</p>
            </div>
          `
        })
        await prisma.task.update({
          where: { id: task.id },
          data: { reminderSent24h: true }
        })
        results.sent24h++
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    console.error('CRON ERROR:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
