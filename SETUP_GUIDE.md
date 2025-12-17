# 🚀 Complete Setup Guide - Golf Club Recommender

This guide will walk you through setting up your Golf Club Recommender app from scratch and getting it live on the internet. No technical experience required!

## Table of Contents
- [What You'll Need](#what-youll-need)
- [Step 1: Get Your API Keys](#step-1-get-your-api-keys)
- [Step 2: Fork/Clone This Repository](#step-2-forkclone-this-repository)
- [Step 3: Deploy to Render](#step-3-deploy-to-render)
- [Step 4: Test Your Live App](#step-4-test-your-live-app)
- [Troubleshooting](#troubleshooting)
- [Local Development (Optional)](#local-development-optional)

---

## What You'll Need

Before starting, make sure you have:
- [ ] A GitHub account (free) - [Sign up here](https://github.com/signup)
- [ ] A Render account (free) - [Sign up here](https://render.com/register)
- [ ] An OpenWeatherMap account (free) - [Sign up here](https://openweathermap.org/api)
- [ ] (Optional) A Golf Course API account (free) - [Sign up here](https://golfcourseapi.com/)

**Time Required**: 15-20 minutes

---

## Step 1: Get Your API Keys

### 1.1 OpenWeatherMap API Key (REQUIRED)

This provides real-time weather data for wind and temperature adjustments.

#### Step-by-step:

1. **Go to OpenWeatherMap**
   - Visit: https://openweathermap.org/api
   - Click "Sign Up" (or "Sign In" if you have an account)

2. **Create Your Account**
   - Enter your email, username, and password
   - Agree to the terms
   - Click "Create Account"
   - Check your email and click the verification link

3. **Get Your API Key**
   - After logging in, click on your username (top right)
   - Click "My API keys"
   - You should see a default API key already created
   - Copy this key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
   - **SAVE THIS KEY** - paste it into a text file for now

4. **Wait for Activation**
   - New API keys take 10-120 minutes to activate
   - You can continue with the setup while waiting

#### What you get (Free Tier):
- ✅ 1,000 API calls per day
- ✅ Current weather data
- ✅ More than enough for personal use

---

### 1.2 Golf Course API Key (OPTIONAL but Recommended)

This lets you search for golf courses and auto-fill hole locations.

#### Step-by-step:

1. **Go to Golf Course API**
   - Visit: https://golfcourseapi.com/
   - Click "Sign Up" or "Get Started"

2. **Create Your Account**
   - Enter your email address
   - Create a password
   - Verify your email

3. **Get Your API Key**
   - Log in to your dashboard
   - Look for "API Key" or "API Credentials"
   - Copy your API key
   - **SAVE THIS KEY** - paste it into your text file

#### What you get (Free):
- ✅ Access to 30,000+ golf courses worldwide
- ✅ Course locations and basic hole data
- ✅ Completely free forever

**Note**: If you skip this, you can still use the app with the "Rangefinder" or "Direct Coordinates" GPS tracking methods.

---

## Step 2: Fork/Clone This Repository

You need to get this code into your own GitHub account.

### Option A: If you already have this code in GitHub

Skip to Step 3!

### Option B: If you need to upload this code to GitHub

1. **Create a New Repository**
   - Go to GitHub and log in
   - Click the "+" icon (top right) → "New repository"
   - Name it: `golf-club-recommender`
   - Choose "Public"
   - Do NOT initialize with README (we already have one)
   - Click "Create repository"

2. **Upload Your Code**

   **If you're comfortable with Git:**
   ```bash
   cd /home/user/caddy_app
   git remote add origin https://github.com/YOUR_USERNAME/golf-club-recommender.git
   git push -u origin main
   ```

   **If you're NOT comfortable with Git:**
   - On the repository page, click "uploading an existing file"
   - Drag and drop all files from your `caddy_app` folder
   - Click "Commit changes"

3. **Verify Upload**
   - You should see all your files in the GitHub repository
   - Files should include: `server.js`, `package.json`, `public/` folder, etc.

---

## Step 3: Deploy to Render

Now we'll make your app live on the internet!

### 3.1 Create a New Web Service

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Log in to your Render account

2. **Create New Web Service**
   - Click the "New +" button (top right)
   - Select "Web Service"

3. **Connect GitHub**
   - If first time: Click "Connect GitHub"
   - Authorize Render to access your repositories
   - Select your `golf-club-recommender` repository
   - Click "Connect"

### 3.2 Configure Your Service

Fill in the following settings:

1. **Name**
   ```
   golf-club-recommender
   ```
   (or whatever you want - this will be part of your URL)

2. **Region**
   - Choose the region closest to you (e.g., "Oregon (US West)")

3. **Branch**
   ```
   main
   ```
   (or your current branch name)

4. **Root Directory**
   - Leave blank

5. **Environment**
   ```
   Node
   ```

6. **Build Command**
   ```
   npm install
   ```

7. **Start Command**
   ```
   npm start
   ```

8. **Instance Type**
   - Select **"Free"** (this gives you free hosting!)

### 3.3 Add Environment Variables

This is where you add your API keys!

1. **Scroll down to "Environment Variables"**
   - Click "Add Environment Variable"

2. **Add OpenWeatherMap API Key**
   - Key: `OPENWEATHER_API_KEY`
   - Value: (paste your OpenWeatherMap API key)
   - Click "Add"

3. **Add Golf Course API Key** (if you got one)
   - Click "Add Environment Variable" again
   - Key: `GOLF_COURSE_API_KEY`
   - Value: (paste your Golf Course API key)
   - Click "Add"

4. **Add Port** (optional but recommended)
   - Click "Add Environment Variable"
   - Key: `PORT`
   - Value: `3000`

### 3.4 Deploy!

1. **Create Web Service**
   - Scroll to the bottom
   - Click "Create Web Service"

2. **Wait for Deployment**
   - Render will now build and deploy your app
   - You'll see a log stream showing the progress
   - Look for messages like:
     ```
     ==> Installing dependencies...
     ==> Running 'npm install'
     ==> Build successful!
     ==> Starting service...
     ==> Server is running on port 3000
     ```
   - **This takes 2-5 minutes**

3. **Get Your Live URL**
   - Once deployed, you'll see "Live" with a green dot
   - Your URL will be at the top: `https://golf-club-recommender-XXXX.onrender.com`
   - Click it to open your app!

---

## Step 4: Test Your Live App

Let's make sure everything works!

### 4.1 Basic Functionality Test

1. **Open Your App**
   - Click your Render URL
   - You should see "⛳ Golf Club Recommender"

2. **Test Manual Mode**
   - You should see "📝 Manual Distance" selected
   - Enter distance: `150`
   - Select skill level (beginner is default)
   - Make sure "Use local weather conditions" is checked
   - Click "Get Recommendation"

3. **Check for Browser Location Permission**
   - Your browser will ask for location permission
   - Click "Allow"
   - The app needs this to get weather data

4. **Verify Results**
   - You should see a club recommendation (e.g., "7-Iron")
   - Weather conditions should appear
   - Alternatives should show

**If this works:** ✅ Your app is fully functional!

### 4.2 Test GPS Tracking Mode

1. **Switch to GPS Mode**
   - Click "📍 GPS Tracking"

2. **Test Rangefinder Option**
   - Expand "📏 Use Rangefinder"
   - Enter distance: `150`
   - Click "Mark Position & Start Tracking"
   - Allow location permission
   - Walk a few steps in any direction
   - You should see distance tracking

**If this works:** ✅ GPS tracking is working!

### 4.3 Test Course Lookup (if you added Golf Course API key)

1. **In GPS Mode, expand "🏌️ Find My Course"**

2. **Search for a course**
   - Try: `Pebble Beach`
   - Click "Search Courses"

3. **Verify Results**
   - You should see course results
   - If you see "Golf Course API not configured" → check your API key in Render

---

## Troubleshooting

### Issue: "Failed to fetch weather data"

**Possible Causes:**
- OpenWeatherMap API key not activated yet (wait 10-120 minutes)
- API key entered incorrectly
- Location permission denied

**Solutions:**
1. Check Render environment variables:
   - Go to Render Dashboard → Your Service → Environment
   - Verify `OPENWEATHER_API_KEY` is set correctly
   - Click "Save Changes" and wait for redeploy

2. Test API key manually:
   - Visit: `https://api.openweathermap.org/data/2.5/weather?lat=37.7749&lon=-122.4194&appid=YOUR_API_KEY`
   - Replace `YOUR_API_KEY` with your actual key
   - If you see weather data → key works
   - If you see error → key is invalid or not activated

### Issue: "Golf Course API not configured"

**Solutions:**
1. Add the Golf Course API key to Render:
   - Dashboard → Your Service → Environment
   - Add variable: `GOLF_COURSE_API_KEY`
   - Save and wait for redeploy

2. Or just use Rangefinder/Direct Coordinates methods instead

### Issue: App won't load / "Service Unavailable"

**Solutions:**
1. Check Render logs:
   - Dashboard → Your Service → Logs
   - Look for errors in red

2. Common issues:
   - Build failed → Check that all files uploaded correctly
   - Port issues → Make sure Start Command is `npm start`
   - Dependencies → Render should run `npm install` automatically

### Issue: GPS not working

**Solutions:**
1. Check browser location permission:
   - Click lock icon in address bar
   - Ensure "Location" is set to "Allow"

2. Use HTTPS:
   - GPS only works on HTTPS (Render provides this automatically)
   - Never works on plain HTTP

### Issue: Recommendations seem wrong

**Possible Causes:**
- Handicap not set correctly
- Weather adjustments too aggressive

**Solutions:**
- Try different skill levels
- Toggle "Use local weather conditions" off to see base recommendations

---

## Local Development (Optional)

Want to test changes locally before deploying?

### Prerequisites
- Node.js 18+ installed ([Download here](https://nodejs.org/))
- Git installed ([Download here](https://git-scm.com/))

### Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/golf-club-recommender.git
   cd golf-club-recommender
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` File**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` File**
   ```
   PORT=3000
   OPENWEATHER_API_KEY=your_actual_api_key_here
   GOLF_COURSE_API_KEY=your_actual_api_key_here
   ```

5. **Run Locally**
   ```bash
   npm start
   ```

6. **Open Browser**
   - Go to: http://localhost:3000

### Making Changes

1. Edit files in `public/` folder (HTML, CSS, JS)
2. Edit `server.js` for backend logic
3. Save files and refresh browser
4. When ready to deploy:
   ```bash
   git add .
   git commit -m "Your changes description"
   git push origin main
   ```
5. Render will automatically redeploy!

---

## Free Tier Limits

### Render Free Tier
- ✅ 750 hours/month (enough for 24/7)
- ✅ Auto-deploy from GitHub
- ✅ Custom domains
- ⚠️ Sleeps after 15 min of inactivity (first request takes ~30 sec to wake)
- ⚠️ Limited to 512 MB RAM

### OpenWeatherMap Free Tier
- ✅ 1,000 API calls/day
- ✅ ~40 calls/hour
- ⚠️ Enough for personal use, not for high traffic

### Golf Course API Free Tier
- ✅ Unlimited access
- ✅ 30,000+ courses
- ✅ No rate limits (reasonable use)

---

## Upgrading (Optional)

Want faster performance or no sleep time?

### Render Paid Plan ($7/month)
- No sleep time
- More RAM and CPU
- Priority support

### OpenWeatherMap Paid ($40-180/month)
- More API calls
- Minute-by-minute forecasts
- Historical data

---

## Next Steps

Now that your app is live:

1. **Share Your URL**
   - Send your Render URL to friends
   - Use it on the golf course!

2. **Bookmark on Mobile**
   - Open URL on phone
   - Add to Home Screen (works like an app!)

3. **Customize**
   - Edit colors in `public/styles.css`
   - Modify club distances in `server.js`
   - Add your own features

4. **Get a Custom Domain** (Optional)
   - Buy a domain (e.g., `mygolfapp.com`)
   - Add it in Render: Dashboard → Your Service → Settings → Custom Domain

---

## Support

- **Issues?** Check the [Troubleshooting](#troubleshooting) section
- **Questions?** Open an issue on GitHub
- **Want to contribute?** Pull requests welcome!

---

## Summary Checklist

Use this to track your setup progress:

- [ ] Created OpenWeatherMap account and got API key
- [ ] (Optional) Created Golf Course API account and got API key
- [ ] Uploaded code to GitHub repository
- [ ] Created Render account
- [ ] Created new Web Service on Render
- [ ] Connected GitHub repository
- [ ] Configured build/start commands
- [ ] Added environment variables (API keys)
- [ ] Deployed successfully
- [ ] Tested Manual Mode
- [ ] Tested GPS Tracking Mode
- [ ] (Optional) Tested Course Lookup
- [ ] Bookmarked app on phone
- [ ] Started using on the golf course!

---

**Congratulations! Your Golf Club Recommender is now live! ⛳**

Enjoy better club selection on the course!
