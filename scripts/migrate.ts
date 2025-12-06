import { execSync } from "child_process";

// Run migrations in production
if (process.env.NODE_ENV === "production") {
  console.log("Running database migrations...");
  try {
    execSync("npm run db:push", { stdio: "inherit" });
    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Failed to run migrations:", error);
    process.exit(1);
  }
}
