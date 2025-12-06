import { db, storage } from "../server/storage";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const username = 'Kai';
  const password = '#487530Turbo';

  try {
    // Check if admin user already exists
    const existing = await storage.getUserByUsername(username);
    if (existing && existing.role === 'admin') {
      console.log('Admin user already exists:', JSON.stringify(existing, null, 2));
      process.exit(0);
    }

    // Create or update admin user
    if (!existing) {
      const created = await storage.createUser({
        username,
        password,
        role: 'admin'
      });
      console.log('Admin user created successfully:', JSON.stringify(created, null, 2));
    } else {
      // Update existing user to admin
      await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.username, username));
      console.log('Existing user promoted to admin');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error setting up admin user:', err);
    process.exit(1);
  }
}

main();
