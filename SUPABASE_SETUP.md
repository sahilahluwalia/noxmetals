# Supabase Authentication Setup Guide 🚀

This guide will help you set up Supabase authentication for your NOX METALS project.

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. Node.js 18+ and npm/pnpm installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created (usually takes 1-2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root:
```bash
touch .env.local
```

2. Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

## Step 4: Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:

### Site URL
- Set to your development URL: `http://localhost:3000`
- For production, add your domain

### Redirect URLs
Add these redirect URLs for OAuth and email confirmation:
```
http://localhost:3000/auth/callback
http://localhost:3000/auth
http://localhost:3000/signup
```

### Email Templates (Optional)
- Customize email templates for signup confirmation
- Set your company branding

## Step 5: Enable Authentication Providers

### Email/Password Authentication
- **Enabled by default** ✅
- Users can sign up with email and password

### Social Authentication (Optional)
To enable social login providers:

1. Go to **Authentication** → **Providers**
2. Enable desired providers (Google, GitHub, LinkedIn)
3. Configure OAuth credentials for each provider

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase

#### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL:
   - `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

## Step 6: Test Your Setup

1. Start your development server:
```bash
npm run dev
# or
pnpm dev
```

2. Navigate to `/signup` to test user registration
3. Navigate to `/auth` to test user login
4. Check your Supabase dashboard under **Authentication** → **Users** to see registered users

## Step 7: Database Schema (Optional)

If you want to store additional user data, you can create custom tables:

```sql
-- Example: Create a profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  company TEXT,
  newsletter BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your environment variables are correct
   - Ensure you're using the anon/public key, not the service role key

2. **OAuth redirect errors**
   - Verify redirect URLs are correctly configured in Supabase
   - Check that OAuth provider credentials are correct

3. **Email confirmation not working**
   - Check email templates in Supabase dashboard
   - Verify SMTP settings if using custom email provider

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Security Best Practices

1. **Never expose your service role key** in client-side code
2. **Use Row Level Security (RLS)** for database tables
3. **Validate user input** on both client and server
4. **Implement proper error handling** without exposing sensitive information
5. **Use HTTPS in production** for all authentication flows

## Production Deployment

When deploying to production:

1. Update environment variables with production URLs
2. Configure production redirect URLs in Supabase
3. Set up proper domain verification
4. Consider using environment-specific Supabase projects
5. Implement proper logging and monitoring

---

🎉 **You're all set!** Your NOX METALS project now has full Supabase authentication with a beautiful, responsive UI.
