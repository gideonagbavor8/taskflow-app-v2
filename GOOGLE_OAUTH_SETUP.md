# Google OAuth Setup Guide

This guide will help you set up Google OAuth for NextAuth.js authentication.

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project:**
   - Click the project dropdown at the top
   - Click "New Project"
   - Project name: `TaskFlow App` (or any name you prefer)
   - Click "Create"
   - Wait for the project to be created (may take a few seconds)

## Step 2: Enable Google+ API / OAuth Consent Screen

1. **Configure OAuth Consent Screen:**
   - In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
   - Choose **"External"** (unless you have a Google Workspace account, then use "Internal")
   - Click **"Create"**

2. **Fill in the OAuth Consent Screen:**
   - **App name:** `TaskFlow` (or your app name)
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
   - Click **"Save and Continue"**

3. **Scopes (Optional):**
   - Click **"Add or Remove Scopes"**
   - Select these scopes (if not already selected):
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click **"Update"** → **"Save and Continue"**

4. **Test Users (For Development):**
   - If your app is in "Testing" mode, add test users:
     - Click **"Add Users"**
     - Add your email address (and any test accounts)
   - Click **"Save and Continue"**

5. **Summary:**
   - Review the information
   - Click **"Back to Dashboard"**

## Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials:**
   - In the left sidebar, go to **"APIs & Services"** → **"Credentials"**

2. **Create OAuth Client ID:**
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"OAuth client ID"**

3. **Configure OAuth Client:**
   - **Application type:** Select **"Web application"**
   - **Name:** `TaskFlow Web Client` (or any name)

4. **Authorized JavaScript origins:**
   - Click **"+ ADD URI"**
   - Add: `http://localhost:3000`
   - (For production, also add your production URL)

5. **Authorized redirect URIs:**
   - Click **"+ ADD URI"**
   - Add: `http://localhost:3000/api/auth/callback/google`
   - (For production, also add: `https://yourdomain.com/api/auth/callback/google`)

6. **Create:**
   - Click **"Create"**
   - A popup will appear with your credentials!

## Step 4: Copy Your Credentials

After clicking "Create", you'll see a popup with:

- **Your Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Your Client Secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

**⚠️ IMPORTANT:** Copy these immediately! The Client Secret won't be shown again.

## Step 5: Add to Your .env.local

Add these to your `.env.local` file:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret-here"
```

**Example:**
```env
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
```

## Step 6: Restart Your Development Server

After adding the credentials:

1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. Try signing in with Google!

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check for typos, trailing slashes, or http vs https

### "Access blocked: This app's request is invalid"
- Your app might be in "Testing" mode
- Add your email as a test user in OAuth Consent Screen
- Or publish your app (for production use)

### "OAuth client not found"
- Double-check your Client ID and Secret in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env.local`

### Can't find the Client Secret?
- Go to Credentials → Click on your OAuth 2.0 Client ID
- You can reset the secret if needed (old one will stop working)

## Production Setup

When deploying to production:

1. **Update OAuth Consent Screen:**
   - Add your production domain
   - Publish your app (if ready)

2. **Add Production URLs:**
   - In Credentials, edit your OAuth client
   - Add production URLs:
     - **Authorized JavaScript origins:** `https://yourdomain.com`
     - **Authorized redirect URIs:** `https://yourdomain.com/api/auth/callback/google`

3. **Update .env:**
   - Use the same Client ID and Secret (they work for both dev and prod)
   - Update `NEXTAUTH_URL` to your production URL

## Quick Reference

- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Consent Screen:** APIs & Services → OAuth consent screen
- **Credentials:** APIs & Services → Credentials
- **Redirect URI format:** `http://localhost:3000/api/auth/callback/google`

