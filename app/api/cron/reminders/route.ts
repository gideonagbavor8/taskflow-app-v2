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
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  try {
    // Find all High Priority tasks due in the next 24 hours that haven't been alerted today
    const upcomingTasks = await prisma.task.findMany({
      where: {
        priority: 'HIGH',
        status: { not: 'DONE' },
        dueDate: {
          lte: tomorrow,
          gt: now
        }
      },
      include: { user: true }
    })

    // Group tasks by user
    const userDigests: Record<string, { email: string, name: string, tasks: any[] }> = {}
    
    for (const task of upcomingTasks) {
      if (task.user?.email) {
        if (!userDigests[task.user.id]) {
          userDigests[task.user.id] = {
            email: task.user.email,
            name: task.user.name || 'TaskFlow User',
            tasks: []
          }
        }
        userDigests[task.user.id].tasks.push(task)
      }
    }

    let emailsSent = 0

    // Send one digest email per user
    for (const userId in userDigests) {
      const digest = userDigests[userId]
      
      await resend.emails.send({
        from: 'TaskFlow <onboarding@resend.dev>',
        to: digest.email,
        subject: `📅 Your Daily High-Priority Digest (${digest.tasks.length} tasks)`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0891b2; margin-bottom: 5px;">Good Morning, ${digest.name}!</h2>
            <p style="color: #64748b; margin-top: 0;">Here are your high-priority tasks due within the next 24 hours.</p>
            
            <div style="margin: 25px 0;">
              ${digest.tasks.map(task => `
                <div style="padding: 15px; border-left: 4px solid #ef4444; background: #fef2f2; border-radius: 4px; margin-bottom: 12px;">
                  <strong style="display: block; color: #b91c1c;">${task.title}</strong>
                  <span style="font-size: 13px; color: #7f1d1d;">Due: ${new Date(task.dueDate!).toLocaleString()}</span>
                </div>
              `).join('')}
            </div>

            <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Open TaskFlow Dashboard</a>
            
            <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              You receive this daily because you have high-priority tasks upcoming. Stay productive!
            </p>
          </div>
        `
      })
      emailsSent++
    }

    return NextResponse.json({ success: true, userDigests: Object.keys(userDigests).length, totalTasks: upcomingTasks.length, emailsSent })
  } catch (error) {
    console.error('CRON ERROR:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
