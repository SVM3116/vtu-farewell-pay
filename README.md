Looking at the screenshot — the README is rendering as raw markdown/code instead of formatted content. The issue is that GitHub is showing it unrendered because the file has formatting issues at the top. The `<div align="center">` block before the heading is breaking the render.

Here is the corrected README:

````markdown
# 🎓 Farewell '26 — Payment Management System

**Institution:** Visvesvaraya Technological University (VTU), Belagavi
**Event:** Farewell Day for the 4th Year Batch of 2022–23
**Deployment:** https://vtu-farewell-pay.vercel.app/

---

## 📌 Overview

The **Farewell '26 Payment Management System** is a production-grade, full-stack web application built to digitize and manage the entire payment collection and expense tracking process for the farewell event of VTU Batch 2022–23 held on 8th & 9th May 2026.

Built to eliminate the chaos of manual money collection in college events, this system introduces structured validation, automated verification, role-based access control, and complete financial transparency — transforming a basic form into an institutional-grade finance operations platform.

---

## 🎯 Problem Statement

In a typical college setup, collecting event contributions manually leads to:

- Confusion in tracking who paid and who did not
- Duplicate or fake payment claims
- Difficulty managing large amounts of money
- Excessive dependency on one person (finance head)
- No transparency for students

This system solves all of these problems.

---

## ✨ Key Features

### 🎓 Student Experience
- Cinematic landing page with floating neon orbs and staggered animations
- 4-step payment journey: Details → QR Instructions → Verification → Gratitude
- Dual payment mode: UPI (QR-based) and Cash options
- Dynamic QR code that auto-updates based on year and amount
- Real-time USN and UTR duplicate detection
- Smart resubmission — rejected students resubmit with the same USN
- Real-time payment status tracking via USN lookup

### 👥 CR (Class Representative) Portal
- Scoped access — CRs see only their assigned year, branch, and division
- Authority lock — CRs verify cash payments only; UPI is system-handled
- Three-tier analytics: total submissions, cash collected, UPI collections
- Double-ring stamp badge as visual verification authority indicator
- Admin kill switch — disable CR access globally or individually
- Secure credential retrieval via agreement gate at /cr-access

### 🏛️ Admin Finance Command Center
- Professional high-density financial ledger
- Fund split tracking — UPI vs Cash collections separated
- Date range engine — filter and sum payments for any time window
- CSV auto-verification — batch approve UPI payments via bank statement
- Excel corruption handling — detects scientific notation UTR errors
- Reset control — undo any verification without touching Supabase
- Structured rejections with predefined reasons
- Full CR account lifecycle management

### 📊 Expense Tracker
- Complete expense ledger tracking all event spending by category
- Per-category budget allocation with progress bar tracking
- Dual file uploads — bill/invoice and payment proof stored separately
- Financial summary: total collected vs total spent vs remaining balance
- Vendor name and contact tracking per expense entry
- Public financial transparency page visible to all students

### 🔐 Security and Audit
- Supabase Row Level Security on all tables
- Complete audit trail — every action logged with timestamp and actor
- Protected routes with role-based access enforcement
- Admin login not linked publicly in the navbar
- Agreement gate — CRs accept responsibility before accessing credentials
- Confirmation modals before all destructive actions

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion + canvas-confetti |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Security | Supabase RLS + Protected Routes |
| Storage | Supabase Storage |
| QR Generation | qrcode.react |
| CSV Processing | papaparse |
| Deployment | Vercel + GitHub CI/CD |

---

## 🎨 Design System

| Property | Value |
|---|---|
| Theme | Dark Cinematic + Neon Glassmorphism |
| Base Color | #0a0f1e (Deep Navy) |
| Neon Cyan | #00f5ff |
| Neon Violet | #bf00ff |
| Amber | #f59e0b |
| Style | Glassmorphism cards with neon glow borders |

---

## 👥 Role System

```
Student
  └── Submits payment → Checks status → Resubmits if rejected

CR (Class Representative)
  └── Verifies cash payments → Logs actions → Scoped to own class

Admin (Finance Head)
  └── Full control → CSV verification → Expense tracking → Audit
```

---

## 💰 Payment Amount Logic

| Year | Amount |
|---|---|
| 1st Year | ₹150 |
| 2nd Year | ₹150 |
| 3rd Year | ₹400 |

Amount is auto-assigned based on year and cannot be modified by the student.

---

## 🗄️ Database Schema

### payments
```
id, name, usn (UNIQUE), mobile, year, branch, division,
amount, utr (UNIQUE), payment_method, status,
verified_by, verified_at, rejection_reason,
bank_transaction_time, amount_flag, created_at, updated_at
```

### cr_accounts
```
id, name, email (UNIQUE), password,
year, branch, division, mobile, is_active
```

### audit_logs
```
id, action, performed_by, role, payment_id,
usn, reason, previous_values (JSONB), timestamp
```

### expenses
```
id, expense_id, title, category, amount, paid_to,
vendor_contact, payment_method, expense_date, notes,
bill_url, payment_proof_url, added_by, created_at, updated_at
```

### category_budgets
```
id, category, budget_amount, created_at, updated_at
```

---

## 📁 Project Structure

```
VTU-FAREWELL-PAY/
├── public/
│   ├── favicon.png
│   └── logo-vtu.png
├── src/
│   ├── api/
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── payments.js
│   │   └── supabase.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PageWrapper.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── GlassCard.jsx
│   │       ├── Input.jsx
│   │       ├── Select.jsx
│   │       ├── Skeleton.jsx
│   │       ├── StampBadge.jsx
│   │       └── StatusBadge.jsx
│   ├── pages/
│   │   ├── Admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── AdminLogin.jsx
│   │   ├── CR/
│   │   │   ├── CRAccess.jsx
│   │   │   ├── CRDashboard.jsx
│   │   │   └── CRLogin.jsx
│   │   ├── Expenses/
│   │   │   └── ExpenseLedger.jsx
│   │   ├── Landing/
│   │   │   └── LandingPage.jsx
│   │   ├── Status/
│   │   │   └── StatusCheck.jsx
│   │   └── Submit/
│   │       └── PaymentForm.jsx
│   ├── utils/
│   │   ├── constants.js
│   │   ├── csvProcessor.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env
├── index.html
├── tailwind.config.js
├── vercel.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vtu-farewell-pay.git

# Navigate into the project
cd vtu-farewell-pay

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_UPI_ID=your_upi_id
VITE_ADMIN_EMAIL=your_admin_email
VITE_ADMIN_PASSWORD=your_admin_password
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 🔗 Application Routes

| Route | Access | Description |
|---|---|---|
| / | Public | Landing page |
| /submit | Public | Student payment form |
| /status | Public | Payment status check |
| /expenses | Public | Financial transparency ledger |
| /cr-login | Public | CR login |
| /cr-access | Public | CR credential retrieval |
| /cr-dashboard | CR only | CR verification dashboard |
| /admin-login | Hidden | Admin login — not in navbar |
| /admin-dashboard | Admin only | Finance command center |

---

## 🔄 System Flow

```
Student fills 4-step form
         ↓
Pays via UPI QR code or Cash
         ↓
Submits UTR number (or CASH_USN for cash)
         ↓
Entry saved as PENDING
         ↓
     UPI Payment              Cash Payment
Admin uploads bank CSV    CR logs in and verifies
System auto-approves      CR approves or rejects
matched transactions      with mandatory reason
         ↓                        ↓
         Status updates (Approved / Rejected / Disputed)
                        ↓
         Student checks status via USN on /status
                        ↓
         All actions logged in audit_logs table
```

---

## 📊 CSV Auto-Verification Engine

The system supports automated UPI payment verification via bank statement CSV upload.

**How it works:**
1. Admin uploads the daily bank statement CSV file
2. System normalizes UTR numbers and handles Excel scientific notation
3. Matches student-submitted UTRs against bank Transaction IDs
4. Validates the amount against the Transaction Amount column
5. Auto-approves records where both UTR and amount match
6. Flags records where UTR matches but amount differs
7. Skips already-approved records to prevent duplicate processing
8. Logs all system actions in the audit trail

**Required CSV columns:**
```
Transaction Date and Time | Product | Received From |
Payment Mode | Transaction ID | Transaction Amount |
Net MDR (Inclusive GST) | Amount Added
```

---

## 🔐 Security Features

- Supabase Row Level Security enabled on all tables
- CR access strictly scoped to assigned year, branch, and division
- Admin login route not linked anywhere in the public UI
- CR agreement gate before credential access is granted
- Global and individual kill switch to disable CR verification
- All destructive actions guarded by confirmation modals
- Full audit trail with JSONB previous values stored for every edit

---

## 🔄 Payment State Machine

```
pending  →  approved   (CR / System / Admin)
pending  →  rejected   (CR / Admin)
approved →  disputed   (Admin only)
rejected →  resubmitted → pending   (Student, no cooldown)
```

---

## 📱 Responsive Design

- Desktop: high-density professional data tables
- Mobile: glassmorphism card layouts with no horizontal scroll
- Navbar: 3-zone layout on desktop, hamburger menu on mobile
- Forms: mobile-optimized step-by-step flow throughout

---

## 🎬 Animations

- Cinematic page transitions using Framer Motion AnimatePresence
- Floating neon orbs on the landing page
- Staggered hero text reveal on page load
- QR code fade and scale animation on year change
- Pending badge breathing glow pulse animation
- Confetti burst on successful payment submission
- Shimmer skeleton loading states on dashboards

---

## 📤 Export Features

- Payments export: full filtered payment dataset as CSV
- Expense export: full filtered expense ledger as CSV
- Dynamic filenames with date stamps
- CR scoped export: CRs export only their assigned class data

---

## 🧑‍💻 Developed By

**ONE RUPEE**
3rd Year, CSBS
Visvesvaraya Technological University, Belagavi

*Built with love for the Farewell of Batch 2022–23*

---

## 🎓 Farewell '26 — One Last Grand Celebration

*Batch 2022–23 | 8th & 9th May 2026 | VTU, Belagavi*
````