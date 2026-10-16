import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const sessionId = new URL(req.url).searchParams.get('sessionId');

    if (typeof sessionId !== 'string' || sessionId.length < 1 || sessionId.length > 100) {
      return NextResponse.json({ messages: [] });
    }

    const user = await prisma.user.findUnique({ where: { sessionId } });
    if (!user) return NextResponse.json({ messages: [] });

    const chat = await prisma.chat.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!chat) return NextResponse.json({ messages: [] });

    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return NextResponse.json({ messages: [] });
  }
}
