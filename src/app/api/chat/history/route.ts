import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const chats = await prisma.chat.findMany({
      where: {
        userId: user.id,
        ...(sessionId ? { sessionId } : {}),
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Failed to retrieve chat history:", error);

    return NextResponse.json(
      { error: "Unable to retrieve chat history" },
      { status: 500 },
    );
  }
}