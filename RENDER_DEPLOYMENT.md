# Render Deployment Guide

This guide explains how to deploy the KYC Arena application to Render.

## Prerequisites

1. A Render account: https://render.com
2. Your GitHub repository connected to Render
3. Node.js 18+ (Render uses this automatically)

## Automatic Deployment with render.yaml

The project includes a `render.yaml` file that automatically configures:

- **Web Service**: Deploys the Node.js/Express backend and React frontend
- **PostgreSQL Database**: Creates a managed PostgreSQL 16 database
- **Build Command**: Runs `npm run build` to build both frontend and backend
- **Start Command**: Runs `npm start` which starts the production server

## Manual Setup (if not using render.yaml)

### Step 1: Create a PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Name: `kyc-arena-db`
4. Region: Choose closest to your users
5. Click "Create Database"
6. Copy the **Internal Database URL** (not the external one)

### Step 2: Create a Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `kyc-arena`
   - **Environment**: `Node`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid as needed)

### Step 3: Set Environment Variables

In the Web Service settings, go to "Environment" and add:

```
DATABASE_URL=<paste the Internal Database URL from PostgreSQL>
NODE_ENV=production
PORT=10000
SESSION_SECRET=<generate a random string>
```

To generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy

1. Click "Create Web Service"
2. The deployment will start automatically
3. The build process will:
   - Install dependencies
   - Build the React frontend
   - Bundle the Express server
   - Run database migrations automatically

## Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `NODE_ENV` | Environment mode | `production` |
| `SESSION_SECRET` | Session encryption key | Random 32-char string |
| `PORT` | Server port | `10000` |

## Accessing Your Deployed App

Once deployed, your app will be available at:
```
https://kyc-arena.onrender.com
```

The exact URL will be provided in your Render dashboard.

## Troubleshooting

### Build Fails

1. Check build logs in Render dashboard
2. Ensure all environment variables are set
3. Verify database connection string is correct

### Database Connection Errors

1. Ensure `DATABASE_URL` uses the **Internal** database URL (not External)
2. The URL format must be: `postgresql://user:password@host:port/database`
3. Wait 2-3 minutes for the database to fully initialize

### Migration Errors

1. Check if migrations are in the `migrations/` folder
2. Verify database migrations ran: `npm run db:push`
3. Check Render logs for detailed error messages

### Port Already in Use

Render automatically assigns port 10000. Do not change this in the code.

## Monitoring and Logs

1. Go to your Web Service in Render
2. Click "Logs" to view real-time application logs
3. Check for any errors during startup

## Updating Your App

1. Make changes to your code
2. Push to GitHub
3. Render automatically redeploys when new commits are detected
4. Check the "Deployments" tab to monitor the build process

## Database Backups

Render PostgreSQL automatically backs up your data. To restore:

1. Go to your PostgreSQL database in Render
2. Click "Backups"
3. Select a backup and restore

## Cost Estimation

- **Free Plan**: Limited resources, suitable for development/testing
- **Paid Plans**: Better performance and reliability for production

More info: https://render.com/pricing

## Support

- Render Docs: https://render.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Express.js Docs: https://expressjs.com/
- React Docs: https://react.dev

## Additional Notes

- The application serves both the API (/api/*) and frontend from the same port
- The frontend is pre-built and bundled into the production server
- No separate build process needed for the frontend during deployment
- Session data is stored in the PostgreSQL database using `connect-pg-simple`
