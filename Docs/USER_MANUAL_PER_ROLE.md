# ConsoliScan User Guide

## Main Features

- Product browsing and search
- Cart and checkout
- Promo and loyalty support
- Order history and receipt viewing
- Returns and exchanges
- Inventory and stock monitoring
- Purchase order and supplier management
- Admin dashboard and reports

## How To Use The System

1. Sign in with your account.
2. Open your dashboard based on your role.
3. Do your daily tasks:
   - Customer: browse products, add to cart, checkout, view orders, request returns
   - Cashier: process customer payments, handle return validation and completion
   - Merchandiser: scan items and help with stock and product updates
   - Admin: monitor operations, manage products/users/inventory, review reports
4. Check updates in orders, inventory, and return status as needed.
5. Log out when finished.

## Simple Role Summary

- Customer: shopping, checkout, order tracking, returns
- Cashier: payment processing and return handling
- Merchandiser: product scanning and stock support
- Admin: full system management and analytics

## Project Setup (Quick Start)

### What you need

- Node.js and npm
- Python 3.10 or newer
- Docker Desktop
- Expo Go app (for mobile testing)

### Initial installation

1. Open a terminal in the project root.
2. Install backend dependencies:
   Run: cd backend
   Run: npm install
3. Install web dependencies:
   Run: cd ../web
   Run: npm install
4. Install mobile dependencies:
   Run: cd ../mobile
   Run: npm install
5. Install ML service dependencies:
   Run: cd ../ml_service
   Run: pip install -r requirements.txt

### Start required services

1. Start blockchain service from the project root:
   Run: docker compose up -d
2. Start backend:
   Run: cd backend
   Run: npm start
3. Start web app:
   Run: cd ../web
   Run: npm run dev
4. Start mobile app:
   Run: cd ../mobile
   Run: npm start
5. Optional ML service start:
   Run: cd ../ml_service
   Run: uvicorn main:app --reload

### Basic startup check

1. Open the web app in browser from the Vite local URL shown in terminal.
2. Log in and confirm dashboard loads.
3. Create a sample cart and checkout flow.
4. Confirm backend is running and blockchain container is healthy.

## Notes

- Most actions are available after sign-in.
- Blockchain logging runs automatically in the background for key transactions.
