# PEPE Play - Setup Instructions

## Quick Start

The application is ready to run! Follow these steps:

### 1. Configure Environment Variables

Edit the `.env` file and replace these placeholders:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  ← Get from Supabase Dashboard
OXAPAY_MERCHANT_API_KEY=your_oxapay_merchant_api_key_here  ← Get from OxaPay
```

### 2. Start the Application

**Option A: Manual Start (Recommended)**

Open 2 terminal windows:

Terminal 1 - Backend:
```bash
node server.js
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Option B: Using the Start Script**

```bash
./START.sh
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

## What Was Fixed

✅ Removed conflicting Next.js API routes causing 404 errors
✅ Fixed environment variable naming (NEXT_PUBLIC → VITE)
✅ Implemented complete withdrawal system with OxaPay
✅ Added balance management database functions
✅ Updated WalletActions component with deposit & withdrawal

## Features

- **Deposit System**: Accept USDT/TRX via OxaPay
- **Withdrawal System**: Send USDT/TRX to user wallets via OxaPay
- **Balance Management**: Real-time balance tracking
- **Transaction History**: Complete transaction tracking
- **Webhook Integration**: Automatic payment confirmations

## Troubleshooting

### 404 Error
- Make sure both backend (port 8080) and frontend (port 5173) are running
- Check that `.env` has `VITE_` prefixed variables, not `NEXT_PUBLIC_`

### Build Errors
```bash
npm run build
```

### Environment Variables Missing
Check that your `.env` file contains all 5 required variables with proper VITE_ prefix.
