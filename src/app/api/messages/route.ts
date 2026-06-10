import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user = searchParams.get('user') || 'Admin';
  
  const messages = await db.message.findMany({
    where: { OR: [{ fromUser: user }, { toUser: user }] },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = await db.message.create({
      data: {
        fromUser: body.fromUser || 'Admin',
        toUser: body.toUser || 'Admin',
        subject: body.subject,
        body: body.body,
      },
    });
    // Create notification for recipient
    await db.notification.create({
      data: {
        type: 'message',
        title: 'Nuovo messaggio',
        message: `${message.fromUser}: ${message.subject}`,
        link: '/messages',
      },
    });
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
