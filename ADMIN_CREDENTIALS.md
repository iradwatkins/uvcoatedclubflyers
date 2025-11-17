# Admin Credentials

## Admin Accounts Created ✅

### Primary Admin
- **Email**: ira@irawatkins.com
- **Password**: Bobby321!
- **Role**: Admin
- **Name**: Ira Watkins

### Secondary Admin
- **Email**: iradwatkins@gmail.com
- **Password**: Bobby321!
- **Role**: Admin
- **Name**: Ira Watkins

---

## Login URL
http://localhost:3001/login

---

## Features Added

### Password Visibility Toggle 👁️
Both login and signup forms now have an **eye icon** that lets you:
- Click to show/hide password
- Toggle for both password and confirm password fields
- Better user experience for password entry

---

## Testing Admin Access

1. Go to http://localhost:3001/login
2. Enter: `ira@irawatkins.com`
3. Enter: `Bobby321!`
4. Click the eye icon to verify password if needed
5. Sign in → You'll be redirected to dashboard
6. You'll see "Admin" link in the navigation (admin-only)

---

## Database Seeding

To re-create admin users or add more users, run:
```bash
npm run db:seed
```

The seed script will:
- Check if users already exist
- Skip duplicates with a warning
- Create new admin accounts if they don't exist

---

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION**:
1. Change these passwords before going live
2. Use stronger passwords (12+ characters)
3. Consider implementing 2FA for admin accounts
4. Rotate admin passwords regularly
5. Monitor admin login attempts

---

## Next Steps

You can now:
- ✅ Login as admin
- ✅ Access admin-only routes
- ✅ Manage the system with full permissions
- 🔜 Build admin product management interface
- 🔜 Set up admin order management
- 🔜 Configure admin print job queue

**Admin panel routes are protected** - only users with `role: 'admin'` can access `/admin/*` routes.
