# Authentication Error Fix - KYC Arena

## Problem
Login is failing with "authentication failed - internal server error"

## Root Cause
The session storage was using `MemoryStore` which doesn't persist data in production. In a Render deployment, this causes sessions to be lost, making logins fail.

## Solution
Update session storage to use PostgreSQL (`connect-pg-simple`) for production deployments.

## Changes Made

### 1. Updated `server/auth.ts`
- Added PostgreSQL session store support
- Now uses `connect-pg-simple` in production
- Falls back to MemoryStore in development
- Added secure cookie settings for production

```typescript
// Now detects environment and uses appropriate store
if (process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  // Use PostgreSQL session store
  store = new PgSession({...})
} else {
  // Use memory store for development
  store = new MemoryStore({...})
}
```

## Steps to Fix Your Deployment

### Step 1: Rebuild and Redeploy
1. Go to your Render dashboard
2. Navigate to your web service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete

OR push the changes to GitHub:
```bash
git add server/auth.ts
git commit -m "Fix: Use PostgreSQL session storage in production"
git push origin main
```
Render will auto-deploy within 1-2 minutes.

### Step 2: Create Admin User for Testing
After deployment, run one of these commands:

#### Option A: Create and Promote Existing User
```bash
npm run make_admin
# This will make user "Kai" an admin
```

#### Option B: Create New Admin User
```bash
npm run db:push  # Ensure database is up to date
npx tsx scripts/create_user_direct.ts admin_user admin_password_123
npx tsx scripts/make_admin.ts  # Then promote to admin
```

#### Option C: Direct Database Query
Connect to your PostgreSQL database and run:
```sql
-- Create admin user
INSERT INTO users (username, password, role, is_approved, is_enabled, is_deleted)
VALUES ('admin', 'your_secure_password', 'admin', true, true, false);

-- Or update existing user to admin
UPDATE users 
SET role = 'admin', is_approved = true, is_enabled = true 
WHERE username = 'your_username';
```

### Step 3: Test Login
1. Go to your application URL
2. Try to login with admin credentials
3. Should now work without "internal server error"

## Expected Behavior After Fix
✅ User sessions persist in database  
✅ Admin login works  
✅ Session continues across page refreshes  
✅ Logout properly clears session  
✅ Multiple users can be logged in simultaneously  

## Troubleshooting

### Still Getting "Internal Server Error"
1. Check Render logs:
   - Go to Render dashboard
   - Click on your web service
   - Select "Logs" tab
   - Look for error messages

2. Ensure environment variables:
   - DATABASE_URL must be set correctly
   - SESSION_SECRET must be set (not empty)
   - NODE_ENV must be "production"

3. Check database:
   - Connection string is correct
   - Database is accessible
   - Tables are created

### Session Table Not Created
The `connect-pg-simple` automatically creates the `session` table if `createTableIfMissing` is true (which it is in our code).

If manually needed:
```sql
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

CREATE INDEX "IDX_session_expire" on "session" ("expire");
```

### Testing Locally
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/kyc"
export NODE_ENV="development"  # or "production"
export SESSION_SECRET="test-secret-key"
npm run dev
```

## Package Dependencies
The fix uses packages already in your `package.json`:
- `connect-pg-simple` ✅ Already installed
- `pg` ✅ Already installed
- `express-session` ✅ Already installed

No new dependencies needed!

## Security Improvements
✅ Sessions now stored securely in database  
✅ Cookies marked as secure in production  
✅ SameSite policy set to "lax"  
✅ Proper session expiration  
✅ Protection against CSRF attacks  

## Performance Impact
✅ Minimal - PostgreSQL caching is very fast  
✅ Sessions loaded from database per request  
✅ Automatic cleanup of expired sessions  

## Rollback (If Needed)
If you need to revert:
```bash
git revert <commit-hash>
git push origin main
```
Render will auto-deploy the reverted version.

## Next Steps
1. ✅ Deploy this fix
2. ✅ Create admin user
3. ✅ Test login
4. ✅ Monitor logs for any issues
5. ✅ Document admin credentials securely

---

**Status:** Ready to Deploy ✅
**Risk Level:** Low (uses standard session storage)
**Testing:** Recommended (test login before production use)

For more help, check the Render logs or contact support.
