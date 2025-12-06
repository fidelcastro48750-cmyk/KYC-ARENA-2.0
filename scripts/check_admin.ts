import { storage } from "../server/storage";

async function main() {
  try {
    console.log("Checking for Kai user...");
    const user = await storage.getUserByUsername("Kai");
    
    if (!user) {
      console.log("❌ User 'Kai' not found in database");
      console.log("\nYou need to create the admin user. Run:");
      console.log("  npm run setup-admin");
      process.exit(1);
    }

    console.log("✅ User 'Kai' found!");
    console.log({
      id: user.id,
      username: user.username,
      role: user.role,
      isEnabled: user.isEnabled,
      isDeleted: user.isDeleted,
      isApproved: user.isApproved,
    });

    if (user.role !== 'admin') {
      console.log("\n⚠️  User 'Kai' exists but is NOT an admin!");
      console.log("User role:", user.role);
    }

    if (!user.isEnabled) {
      console.log("\n⚠️  User 'Kai' is DISABLED!");
    }

    if (user.isDeleted) {
      console.log("\n⚠️  User 'Kai' is DELETED!");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error checking user:", err);
    process.exit(1);
  }
}

main();
