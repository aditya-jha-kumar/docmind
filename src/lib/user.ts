import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getOrCreateUser(){
    const {userId} = await auth();
    
    if(!userId) throw new Error("Unauthorized");

    const clerkUser = await currentUser();

    if(!clerkUser){
        throw new Error("User not found");
    }

    // Create if user doesn't exist, other wise return existing user
    const user = await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: clerkUser.emailAddresses[0].emailAddress,
            plan: "FREE",
        },
    });

    return user;
}