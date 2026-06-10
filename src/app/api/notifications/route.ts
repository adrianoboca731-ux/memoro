import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await db.notification.count({ where: { isRead: false } });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.markAllRead) {
      await db.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
      return NextResponse.json({ success: true });
    }
    const { id } = body;
    const notification = await db.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
