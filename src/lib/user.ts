import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Fast path for returning users: DB lookup only (no Clerk API round-trip).
 * Cached per request so layout + page don't double-fetch.
 */
export const getOrCreateUser = cache(async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, plan: true, createdAt: true },
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User not found");

  return prisma.user.create({
    data: {
      id: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      plan: "FREE",
    },
    select: { id: true, email: true, plan: true, createdAt: true },
  });
});
