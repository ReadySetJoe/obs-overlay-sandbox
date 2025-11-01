# Railway Deployment Guide

Complete step-by-step guide to deploy your OBS Overlay System to Railway.

## Prerequisites

- [ ] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] Twitch Developer application created ([dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps))
- [ ] Spotify Developer application created ([developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)) - Optional

## Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** in the top right
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub account

**You're now signed up!** Railway offers $5 in free credits per month.

---

## Step 2: Create a New Project

1. From your Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. If this is your first time:
   - Click **"Configure GitHub App"**
   - Select which repositories Railway can access (all repos or specific ones)
   - Choose your `obs-overlay-sandbox` repository
4. Back in Railway, select your `obs-overlay-sandbox` repository
5. Click **"Deploy Now"**

Railway will start deploying immediately, but it will fail because we haven't set up the database yet. That's expected!

---

## Step 3: Add PostgreSQL Database

1. In your Railway project, click **"New"** button
2. Select **"Database"**
3. Click **"Add PostgreSQL"**
4. Railway automatically creates the database and sets up `DATABASE_URL` environment variable

**The database is now connected!**

---

## Step 4: Configure Environment Variables

1. Click on your **app service** (not the database) in Railway
2. Click on the **"Variables"** tab
3. Click **"New Variable"** and add each of these:

### Required Variables

```env
# Database (already set by Railway automatically)
DATABASE_URL=${DATABASE_URL}

# NextAuth - IMPORTANT: We'll update NEXTAUTH_URL after first deploy
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=h+22aivs5WLVl43fJBMWpQ4AfmlYZD8f/Q2rsHVFEds=

# Twitch OAuth (get from https://dev.twitch.tv/console/apps)
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here

# Node Environment
NODE_ENV=production
```

### Optional Variables (for Spotify integration)

```env
# Spotify OAuth (get from https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=https://your-app.railway.app/api/spotify/callback
```

**💡 Tips:**

- Railway has a `DATABASE_URL` variable pre-filled - don't change it!
- You can copy-paste all variables at once using "RAW Editor"
- Your generated NEXTAUTH_SECRET is shown above (or generate a new one with `openssl rand -base64 32`)

---

## Step 5: Configure Build Settings (Optional Check)

Railway auto-detects Next.js apps, but let's verify:

1. Click on your app service
2. Go to **"Settings"** tab
3. Scroll to **"Build"** section
4. Verify:
   - **Build Command**: (empty - uses `npm run build` from package.json)
   - **Start Command**: (empty - uses `npm start` from package.json)

**If empty, that's correct!** Our `package.json` handles everything.

---

## Step 6: Get Your Deployment URL

1. Click on your app service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"**
5. Railway will create a URL like: `obs-overlay-sandbox-production-XXXX.up.railway.app`

**Copy this URL!** You'll need it for the next steps.

---

## Step 7: Update Environment Variables with Real URL

Now that you have your deployment URL, update these variables:

1. Go back to **"Variables"** tab
2. Click on `NEXTAUTH_URL` and update it to your real Railway URL:
   ```
   https://obs-overlay-sandbox-production-XXXX.up.railway.app
   ```
3. If using Spotify, update `SPOTIFY_REDIRECT_URI`:
   ```
   https://obs-overlay-sandbox-production-XXXX.up.railway.app/api/spotify/callback
   ```

**Railway will automatically redeploy** when you change variables.

---

## Step 8: Update OAuth Redirect URIs

### Twitch Developer Console

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Click on your application
3. Click **"Manage"**
4. In **"OAuth Redirect URLs"**, click **"Add a new URL"**
5. Add: `https://obs-overlay-sandbox-production-XXXX.up.railway.app/api/auth/callback/twitch`
   (Replace with your actual Railway URL)
6. Click **"Save"**

### Spotify Developer Dashboard (if using Spotify)

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Click **"Edit Settings"**
4. In **"Redirect URIs"**, add: `https://obs-overlay-sandbox-production-XXXX.up.railway.app/api/spotify/callback`
5. Click **"Save"**

---

## Step 9: Monitor Deployment

1. In Railway, click on your app service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Watch the build logs

**Look for:**

- ✅ "Installing dependencies..."
- ✅ "Running postinstall script..." (Prisma generate)
- ✅ "Building Next.js app..."
- ✅ "Build succeeded"
- ✅ "Starting server..."

**If you see errors:**

- Check that all environment variables are set correctly
- Look for "Missing required environment variables" messages
- Verify DATABASE_URL is connected to your PostgreSQL instance

---

## Step 10: Test Your Deployment

1. Visit your Railway URL in a browser
2. You should see your landing page!
3. Click **"Sign in with Twitch"**
4. Authorize the application
5. You should be redirected to your dashboard

**Test checklist:**

- [ ] Landing page loads
- [ ] Twitch sign-in works
- [ ] Dashboard loads with session ID
- [ ] Spotify connection works (if configured)
- [ ] Settings save automatically
- [ ] Twitch chat connection works

---

## Step 11: Add Overlays to OBS

Now use your production URLs in OBS:

1. Add a **Browser Source** in OBS
2. Use your production overlay URL:
   ```
   https://obs-overlay-sandbox-production-XXXX.up.railway.app/overlay/[your-session-id]/chat-highlight
   ```
3. Set Width: **1920**, Height: **1080**, FPS: **60**
4. Check **"Shutdown source when not visible"**
5. Click **OK**

Repeat for each overlay component you want to use!

---

## Troubleshooting

### Deployment fails with "Missing required environment variables"

**Solution:** Check that all required env vars are set in Railway Variables tab:

- `DATABASE_URL` (auto-set)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `NODE_ENV`

### "Error: connect ECONNREFUSED" in logs

**Solution:** Database isn't connected. Make sure:

- PostgreSQL service is running in Railway
- `DATABASE_URL` variable references the database service
- Try redeploying

### Twitch OAuth fails with "redirect_uri_mismatch"

**Solution:**

- Verify `NEXTAUTH_URL` in Railway matches your actual deployment URL
- Check Twitch Developer Console has the correct redirect URI
- Make sure there are no trailing slashes

### Overlays show "Failed to connect to socket"

**Solution:**

- Check browser console for errors
- Verify you're using the production URL (not localhost)
- Ensure WebSocket connections aren't blocked by firewall

### Database migration errors

**Solution:**

```bash
# In Railway, go to your database service
# Click on "Data" tab
# Open "Query" console and run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then redeploy your app - migrations will run fresh
```

---

## Monitoring & Maintenance

### View Logs

1. Railway dashboard → Your app service
2. Click **"Logs"** tab
3. Filter by severity (Info, Warning, Error)

### Database Management

1. Railway dashboard → PostgreSQL service
2. Click **"Data"** tab
3. Use built-in query editor or connect with:
   - **Prisma Studio**: `npx prisma studio` (use DATABASE_URL from Railway)
   - **pgAdmin**: Connect using Railway's connection details

### Check Usage

1. Railway dashboard → Project
2. Click **"Usage"** tab
3. Monitor:
   - Compute hours
   - Bandwidth
   - Database storage

**Free tier limits:**

- $5 credit/month
- Unused credits don't roll over

---

## Updating Your App

### Automatic Deployments (Recommended)

Railway auto-deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway detects the push and deploys automatically!

### Manual Deployment

1. Railway dashboard → Your app service
2. Click **"Deployments"** tab
3. Click **"New Deployment"**
4. Select the branch/commit to deploy

---

## Custom Domain (Optional)

Want to use your own domain instead of `railway.app`?

1. Railway dashboard → Your app service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Custom Domain"**
4. Enter your domain (e.g., `stream.yourdomain.com`)
5. Add the CNAME record to your DNS provider:
   ```
   CNAME: stream.yourdomain.com → your-app.railway.app
   ```
6. Update environment variables with new domain
7. Update OAuth redirect URIs

---

## Cost Optimization Tips

1. **Enable "Sleep Mode"** for dev/staging environments (Settings → Advanced)
2. **Use Postgres Connection Pooling** for better database efficiency
3. **Monitor usage** regularly in Usage tab
4. **Delete unused projects** to save credits

---

## Next Steps

- ✅ App deployed to Railway
- ✅ Database configured
- ✅ OAuth working
- ✅ Overlays in OBS

**Now you can:**

- Stream with your custom overlays!
- Share your overlay dashboard with moderators
- Create multiple sessions for different stream setups
- Monitor viewer engagement through chat highlights

---

## Support

- 🚂 **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- 💬 **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- 🐛 **Report Issues**: GitHub Issues in your repo
- 📖 **App Docs**: See `CLAUDE.md` for technical details

---

**Deployment completed!** 🎉

Your OBS overlay system is now live in production. Happy streaming!
