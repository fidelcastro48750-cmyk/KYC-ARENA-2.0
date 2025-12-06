import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import pgSession from "connect-pg-simple";
import { Pool } from "pg";
import type { User } from "@shared/schema";

const MemoryStore = createMemoryStore(session);
const PgSession = pgSession(session);

export function setupAuth(app: Express) {
  // Determine which store to use based on environment
  let store: any;
  
  if (process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
    // Use PostgreSQL session store in production
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Create session table if it doesn't exist
    pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" on "session" ("expire");
    `).catch(err => {
      console.error("[Auth] Error creating session table:", err);
    });
    
    store = new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: false, // We create it manually above
    });
  } else {
    // Use memory store for development
    store = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "secure-verify-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax",
    },
    store: store,
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Attempting login for username:", username);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.warn("User not found:", username);
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log("User found:", { id: user.id, username: user.username, role: user.role });

        // Check if user is banned (deleted or disabled)
        if (user.isDeleted || !user.isEnabled) {
          console.warn("User is disabled/deleted:", username);
          return done(null, false, { message: "You have been banned from using this platform" });
        }

        // Direct password comparison for demo
        // In production, use bcrypt.compare(password, user.password)
        if (password !== user.password) {
          console.warn("Password mismatch for user:", username);
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log("Authentication successful for:", username);
        return done(null, user);
      } catch (err) {
        console.error("Authentication strategy error:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      // Check if user is banned (deleted or disabled)
      if (user && (user.isDeleted || !user.isEnabled)) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}

export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Admin access required" });
}
