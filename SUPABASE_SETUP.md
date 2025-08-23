# Supabase Configuration Guide

## Issue
You're getting a 400 Bad Request error when trying to access the Supabase storage bucket:
```
GET https://nexxulmmmcmekbzftvvq.supabase.co/storage/v1/bucket/secure-datasets 400 (Bad Request)
```

## Root Cause
The application is using fallback Supabase credentials instead of your actual project credentials, which causes authentication failures when accessing storage buckets.

## Solution

### 1. Create Environment Variables File
Create a `.env` file in your project root with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://nexxulmmmcmekbzftvvq.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the following values:
   - **Project URL**: Use this as `VITE_SUPABASE_URL`
   - **anon public key**: Use this as `VITE_SUPABASE_ANON_KEY`

### 3. Update Your .env File
Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://nexxulmmmcmekbzftvvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
```

### 4. Restart Your Development Server
After creating/updating the `.env` file, restart your development server:

```bash
npm run dev
# or
yarn dev
```

### 5. Verify Configuration
Check the browser console for these log messages:
- ✅ "Storage initialization successful" - Configuration is working
- ❌ "Supabase credentials not configured" - Still need to set environment variables

## Storage Bucket Setup

The application will automatically create the `secure-datasets` bucket if it doesn't exist. The bucket is configured with:

- **Public**: false (private access only)
- **Allowed MIME types**: CSV and Excel files
- **File size limit**: 500MB

## Troubleshooting

### If you still get 400 errors:
1. Verify your Supabase project is active
2. Check that your anon key has the correct permissions
3. Ensure your project has Storage enabled
4. Verify the bucket exists in your Supabase dashboard

### If environment variables aren't loading:
1. Make sure the `.env` file is in the project root
2. Restart your development server
3. Check that the variable names start with `VITE_`

### For Production Deployment:
Set the environment variables in your hosting platform:
- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables
- **Other platforms**: Check their documentation for environment variable configuration

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file should be in your `.gitignore`
- Use different keys for development and production environments
- Regularly rotate your API keys for security 