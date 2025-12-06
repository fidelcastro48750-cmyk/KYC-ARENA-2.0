import { db } from "../server/storage";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function promoteToAdmin(username: string) {
  try {
    console.log(`Promoting ${username} to admin...`);
    
    const result = await db
      .update(users)
      .set({ 
        role: "admin",
        isApproved: true,
        isEnabled: true,
      })
      .where(eq(users.username, username))
      .returning();

    if (result.length === 0) {
      console.error(`User ${username} not found`);
      process.exit(1);
    }

    console.log(`✅ Successfully promoted ${username} to admin`);
    console.log(result[0]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error promoting user:", error);
    process.exit(1);
  }
}

const username = process.argv[2] || "Kai";
promoteToAdmin(username);
