# Nox Metals Admin Dashboard Setup 🚀

This guide will help you set up the admin dashboard functionality for the Nox Metals application.

## Prerequisites

- Supabase project set up and running
- Database access to run SQL scripts
- User authentication already configured

## Setup Steps

### 1. Run the Admin Database Setup Script

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `SUPABASE_ADMIN_SETUP.sql`
4. **IMPORTANT**: Replace `'your-email@example.com'` with your actual email address
5. Run the script

### 2. Verify Database Changes

After running the script, you should see:
- New `user_roles` table created
- Updated RLS policies for the `quotes` table
- New admin functions and views
- Your email set as a super admin

### 3. Test Admin Access

1. Sign in with your email (the one you set as super admin)
2. You should be automatically redirected to `/admin/dashboard`
3. You should see the admin dashboard with access to all quotes

## Admin Features

### User Roles
- **user**: Regular users who can submit quotes
- **admin**: Can view and manage all quotes
- **super_admin**: Can manage user roles and has all admin permissions

### Admin Dashboard Features
- View all submitted quotes from all users
- Filter quotes by status (pending, approved, rejected, in progress)
- Search quotes by name, company, email, or material
- Approve or reject pending quotes
- View detailed quote information
- Access to user information and roles
- Real-time statistics and metrics

### Quote Management
- **Approve**: Change status from 'pending' to 'approved'
- **Reject**: Change status from 'pending' to 'rejected'
- **View Details**: See complete quote information including user details
- **Filter & Search**: Find specific quotes quickly

## Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only see their own quotes (unless admin)
- Admins can see and manage all quotes
- Only super admins can manage user roles
- All database functions are security definer

## Adding New Admins

### Option 1: Using SQL Function (Recommended)
```sql
SELECT promote_to_admin('admin@gmail.com');
```

### Option 2: Direct Database Insert
```sql
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'admin@gmail.com';
```

## Troubleshooting

### Common Issues

1. **"Access denied" errors**
   - Ensure the user has the correct role in `user_roles` table
   - Check that RLS policies are properly set up

2. **Admin dashboard not accessible**
   - Verify the user's role is 'admin' or 'super_admin'
   - Check browser console for any JavaScript errors

3. **Quotes not visible**
   - Ensure the `admin_quotes_view` was created successfully
   - Check that the user has proper permissions

### Debug Steps

1. Check user role:
```sql
SELECT * FROM public.user_roles WHERE user_id = 'your-user-id';
```

2. Test admin function:
```sql
SELECT is_admin('your-user-id');
```

3. Verify quotes view:
```sql
SELECT * FROM admin_quotes_view LIMIT 5;
```

## File Structure

```
noxmetals/
├── app/
│   ├── admin/
│   │   └── dashboard/
│   │       └── page.tsx          # Admin dashboard
│   ├── dashboard/
│   │   └── page.tsx              # User dashboard (updated)
│   ├── components/
│   │   └── Header.tsx            # Header with admin nav
│   └── contexts/
│       └── AuthContext.tsx       # Auth context with roles
├── SUPABASE_ADMIN_SETUP.sql      # Database setup script
└── ADMIN_SETUP_README.md         # This file
```

## Mobile & Tablet Responsiveness

The admin dashboard is fully responsive and includes:
- Mobile-first design approach
- Responsive grid layouts
- Touch-friendly buttons and interactions
- Optimized mobile navigation
- Responsive modals and forms

## Next Steps

After setup, consider:
1. Customizing admin dashboard styling
2. Adding email notifications for quote status changes
3. Implementing audit logs for admin actions
4. Adding bulk quote management features
5. Creating user management interface for super admins

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database permissions and RLS policies
3. Ensure all SQL scripts ran successfully
4. Check that user roles are properly assigned

---

**Note**: Always test admin functionality in a development environment before deploying to production! 🔒
