import { prisma } from '@/lib/prisma';
import { auth } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const user = await (prisma.user as any).findUnique({
            where: { email: session.user.email },
            select: { emailNotifications: true }
        });
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { emailNotifications } = await request.json();
        const updatedUser = await (prisma.user as any).update({
            where: { email: session.user.email },
            data: { emailNotifications },
            select: { emailNotifications: true }
        });
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
