import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Attempt a simple query
        const userCount = await prisma.user.count()
        return NextResponse.json({
            status: 'success',
            message: 'Database connected successfully',
            userCount,
            env_db_url_exists: !!process.env.DATABASE_URL
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message,
            env_db_url_exists: !!process.env.DATABASE_URL
        }, { status: 500 })
    }
}
