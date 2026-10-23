import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ messages: [] });
    }

    const chat = await prisma.chat.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (!chat) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to load chat history:", error);

    return NextResponse.json({ messages: [] });
  }
}
