import { db } from "../server/storage";
import { users, submissions, exchanges, notifications, settings, userStats } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Initialize database tables if they don't exist.
 * This runs on service startup to ensure schema is set up.
 */
export async function initializeDatabase() {
  try {
    console.log("[DB Init] Checking if tables exist...");
    
    // Try a simple query to see if users table exists
    const checkUsersTable = await db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')`
    );
    
    const tableExists = (checkUsersTable.rows[0] as any)?.exists || false;
    
    if (tableExists) {
      console.log("[DB Init] Tables already exist, skipping initialization");
      return true;
    }
    
    console.log("[DB Init] Tables don't exist, creating schema...");
    
    // Create tables using raw SQL (drizzle doesn't have a sync/migrate method)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_approved BOOLEAN NOT NULL DEFAULT false,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        exchange TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS exchanges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        price_usdt NUMERIC(10, 2) NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        total_submissions INTEGER NOT NULL DEFAULT 0,
        total_good INTEGER NOT NULL DEFAULT 0,
        total_bad INTEGER NOT NULL DEFAULT 0,
        total_wrong_password INTEGER NOT NULL DEFAULT 0,
        total_earnings NUMERIC(20, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("[DB Init] Tables created successfully!");
    return true;
  } catch (err) {
    console.error("[DB Init] Error initializing database:", err);
    throw err;
  }
}
