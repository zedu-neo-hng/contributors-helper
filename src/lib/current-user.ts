import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const googleId = session?.user?.id;
  const email = session?.user?.email;

  if (!googleId) {
    return null;
  }

  return prisma.user.upsert({
    where: {
      googleId,
    },
    update: {
      email,
      name: session.user.name,
      image: session.user.image,
    },
    create: {
      googleId,
      email,
      name: session.user.name,
      image: session.user.image,
    },
  });
}