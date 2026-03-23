# Supabase Setup & Testing Guide

## Step 1: Create Supabase Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. **Log in to Supabase**: Go to https://supabase.com/dashboard
2. **Select your project**
3. **Open SQL Editor**: Click on "SQL Editor" in the left sidebar
4. **Create new query**: Click "+ New Query"
5. **Copy and paste** the entire contents of `SUPABASE_SETUP.sql` from this repository
6. **Run the query**: Click the "Run" button (or Cmd/Ctrl+Enter)
7. **Wait for completion**: You should see "Success" message

### Option B: Using SQL File Upload

1. Go to SQL Editor → "+ New Query"
2. Click the upload icon and select `SUPABASE_SETUP.sql`
3. Click "Run"

**Expected Result:**
- ✅ All 6 tables created
- ✅ Row Level Security (RLS) enabled
- ✅ All policies created
- ✅ Triggers and indexes created

---

## Step 2: Enable Email Confirmation (Optional but Recommended)

In Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Under "Email confirmations", toggle **"Enable email confirmations"** to ON
3. Under "Email templates", review the default email template
4. Save changes

This ensures users must verify their email before using the app.

---

## Step 3: Set Up Environment Variables

Your `.env.local` file should already contain:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

If not, get these from Supabase:
1. Go to **Settings** → **API**
2. Copy **"Project URL"** and **"anon public"** key
3. Create/update `.env.local` with these values

---

## Step 4: Start Development Server

```bash
npm run dev
```

This opens your app at `http://localhost:5173`

---

## Step 5: Test Complete Flow

### Test 1: Signup Flow ✅

1. **Go to signup page**: Navigate to `/signup` (or click signup button)
2. **Fill in details**:
   - Email: `test@example.com`
   - Password: `password123` (or any 6+ char password)
   - Confirm: `password123`
3. **Click "Sign Up"**
4. **Expected**: 
   - ✅ Success toast: "Account created! Please check your email..."
   - ✅ Redirected to login page
   - ✅ Email confirmation sent (check spam folder)

### Test 2: Email Confirmation (Optional)

If email confirmations are enabled:
1. **Check your email** for verification link
2. **Click the verification link** to confirm email
3. Then proceed to login

### Test 3: Login Flow ✅

1. **Go to login page**: Cannot skip this - it's your auth gate
2. **Enter credentials**:
   - Email: `test@example.com`
   - Password: `password123`
3. **Click "Sign In"**
4. **Expected**:
   - ✅ Success toast
   - ✅ Redirected to Dashboard
   - ✅ Dashboard loads with no wallets initially

### Test 4: Create Wallet ✅

From Dashboard:
1. **Click "المحافظ" (Wallets)** in bottom navigation
2. **Click "إضافة محفظة" (Add Wallet)** button
3. **Fill details**:
   - Name: "My Wallet"
   - Type: "Cash"
   - Balance: "1000"
   - Currency: "EGP"
   - Color: (choose any)
4. **Click "حفظ" (Save)**
5. **Expected**:
   - ✅ Toast: "تم إضافة المحفظة بنجاح" (Wallet added)
   - ✅ Wallet appears in list
   - ✅ Data persists in Supabase

### Test 5: Add Transaction ✅

1. **Click "المعاملات" (Transactions)**
2. **Click "إضافة معاملة" (Add Transaction)**
3. **Fill details**:
   - Title: "Grocery Shopping"
   - Type: "Expense"
   - Category: "Food"
   - Amount: "350"
   - Wallet: "My Wallet"
   - Date: Today
4. **Click "حفظ" (Save)**
5. **Expected**:
   - ✅ Toast: "تم إضافة المعاملة بنجاح" (Transaction added)
   - ✅ Transaction appears in list
   - ✅ Wallet balance updates
   - ✅ Data persists in Supabase

### Test 6: Check Dashboard ✅

1. **Click "الرئيسية" (Dashboard)**
2. **Expected to see**:
   - ✅ Total wallets count
   - ✅ Total balance
   - ✅ Recent transactions
   - ✅ Quick stats

### Test 7: View Reports ✅

1. **Click "التقارير" (Reports)**
2. **Expected to see**:
   - ✅ Pie chart: Expenses by category
   - ✅ Bar chart: Wallet flows
   - ✅ Line chart: 6-month trends
   - ✅ Period comparison

### Test 8: Settings ✅

1. **Click "الإعدادات" (Settings)**
2. **Test features**:
   - ✅ Change theme (Light/Dark)
   - ✅ Change colors (Primary, Secondary, Accent)
   - ✅ View user info
   - ✅ Click "تسجيل خروج" (Logout)
3. **After logout**:
   - ✅ Redirected to login page
   - ✅ Session cleared in Supabase Auth

### Test 9: Session Persistence ✅

1. **After login and creating data**, refresh the page (F5 or Cmd+R)
2. **Expected**:
   - ✅ Stay logged in
   - ✅ Dashboard shows same data
   - ✅ No data loss

### Test 10: Multi-Device Sync ✅

1. **Open app in another browser/device**
2. **Login with same account**
3. **From device 1**: Create a new wallet
4. **Check device 2**: Refresh → New wallet appears
5. **Expected**: Real-time data sync across devices

---

## Step 6: Verify Data in Supabase

### Check Database Tables

1. Go to Supabase Dashboard → **Table Editor**
2. View each table:
   - **auth.users**: Verify your user exists
   - **users**: Verify linked user record
   - **wallets**: Verify wallet creation
   - **transactions**: Verify transaction creation
   - **user_settings**: Verify settings
   - **wishlist_items**: (Will be empty until tested)
   - **budgets**: (Will be empty until tested)

### Check Logs

1. Go to **Logs** → **Edge Function Logs**
2. Monitor any errors during requests

---

## Troubleshooting

### Issue: "Failed to initialize Supabase"
**Solution**: Check `.env.local` has correct URL and ANON_KEY

### Issue: "RLS policy error" or "unauthorized"
**Solution**: RLS policies may take 2-5 minutes to activate after creation. Wait and try again.

### Issue: "User not found"
**Solution**: Run this in SQL Editor:
```sql
INSERT INTO users (id, email) 
SELECT id, email FROM auth.users 
WHERE id NOT IN (SELECT id FROM users);
```

### Issue: Signup/Login redirects fail
**Solution**: Check that Login.jsx and Signup.jsx exist at `/src/pages/`

### Issue: Transaction updates wallet balance incorrectly
**Solution**: Verify `transactionService.js` has correct balance calculation logic

---

## Next Phase (After Testing Complete)

Once all tests pass, you can proceed with:
- **Phase 1**: Budget Feature Implementation
- **Phase 2**: Core Enhancements (Search, Export, Split, Tags)
- **Phase 3**: Data Management (Import, Forecasting)
- **Phase 4**: Polish & Optimization

---

## Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm build

# Run linting
npm run lint

# Fix lint issues
npm run lint:fix

# Check TypeScript
npm run typecheck

# Preview production build
npm run preview
```

---

## Database Backup

To backup your Supabase data:
1. Go to **Settings** → **Database** → **Backups**
2. Click "Create a manual backup"
3. Or enable automatic daily backups

---

**✅ Setup Complete!** Your Supabase backend is ready. Start testing and enjoy! 🚀
