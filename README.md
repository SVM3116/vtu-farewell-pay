````markdown
# 🎓 Farewell '26 — Payment Management System
**Institution:** Visvesvaraya Technological University (VTU), Belagavi  
**Event:** Farewell Day for the 4th Year Batch of 2022–23  
**Deployment:** https://vtu-farewell-pay.vercel.app/

<div align="center">

![Farewell 26](public/favicon.png)

**A professional, full-stack financial management system built for the VTU Batch 2022–23 Farewell Event**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 📌 Overview

The **Farewell '26 Payment Management System** is a production-grade, full-stack web application built to digitize and manage the entire payment collection and expense tracking process for the farewell event of VTU Batch 2022–23 (8th & 9th May 2026).

Built to eliminate the chaos of manual money collection in college events, this system introduces structured validation, automated verification, role-based access control, and complete financial transparency — transforming a basic form into an institutional-grade finance operations platform.

---

## 🎯 Problem Statement

In a typical college setup, collecting event contributions manually leads to:

- Confusion in tracking who paid and who didn't
- Duplicate or fake payment claims
- Difficulty managing large amounts of money
- Excessive dependency on one person (finance head)
- No transparency for students

This system solves all of these problems.

---

## ✨ Key Features

### 🎓 Student Experience
- **Cinematic Landing Page** — Floating neon orbs, 8xl typography, staggered animations
- **4-Step Payment Journey** — Details → QR Instructions → Verification → Gratitude
- **Dual Payment Mode** — UPI (QR-based) and Cash options
- **Dynamic QR Generation** — Auto-updates based on year and amount
- **Real-time Validation** — Live USN and UTR duplicate detection
- **Smart Resubmission** — Rejected students can resubmit with same USN
- **Status Tracking** — Real-time payment status via USN lookup

### 👥 CR (Class Representative) Portal
- **Scoped Access** — CRs see only their assigned year/branch/division
- **Authority Lock** — CRs can only verify cash payments; UPI is system-handled
- **Three-Tier Analytics** — Total submissions, cash collected, UPI collections
- **Double-Ring Stamp Badge** — Visual verification authority indicator
- **Kill Switch Awareness** — Admin can disable CR access globally or individually
- **Credential Portal** — Secure credential retrieval via agreement gate

### 🏛️ Admin Finance Command Center
- **Financial Ledger** — High-density professional payment table
- **Fund Split Tracking** — UPI vs Cash collections tracked separately
- **Date Range Engine** — Filter and sum payments for any time window
- **CSV Auto-Verification** — Batch approve UPI payments via bank statement upload
- **Excel Corruption Handling** — Detects scientific notation UTR errors
- **Reset Control** — Undo any verification without touching Supabase dashboard
- **Structured Rejections** — Predefined rejection reasons for clear communication
- **Full CR Management** — Create, manage, and control CR access

### 📊 Expense Tracker
- **Complete Expense Ledger** — Track all event spending by category
- **Budget Allocation** — Set per-category budgets with progress tracking
- **Dual File Uploads** — Bill/invoice and payment proof separately stored
- **Financial Summary** — Total collected vs total spent vs remaining balance
- **Vendor Management** — Track vendor names and contacts per expense
- **Public Transparency Page** — Full expense ledger visible to all students

### 🔐 Security & Audit
- **Row Level Security** — Supabase RLS on all tables
- **Complete Audit Trail** — Every action logged with timestamp and actor
- **Protected Routes** — Role-based access enforcement
- **Hidden Admin Route** — Admin login not linked publicly
- **Agreement Gate** — CRs must accept responsibility before accessing credentials

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion + canvas-confetti |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth & Security | Supabase RLS + Protected Routes |
| Storage | Supabase Storage |
| QR Generation | qrcode.react |
| CSV Processing | papaparse |
| Export | papaparse / xlsx |
| Deployment | Vercel + GitHub CI/CD |

---

## 🎨 Design System

- **Theme:** Dark Cinematic / Neon Glassmorphism
- **Base:** `#0a0f1e` (Deep Navy)
- **Neon Cyan:** `#00f5ff`
- **Neon Violet:** `#bf00ff`
- **Amber:** `#f59e0b`
- **Style:** Glassmorphism cards, backdrop-blur, neon glow borders
- **Motion:** Staggered reveals, page transitions, floating orbs, QR animations

---

## 👥 Role System

```
Student → Submits payment → Checks status
    ↓
CR → Verifies cash payments → Logs actions
    ↓
Admin → Full control → CSV verification → Expense tracking → Audit
```

---

## 💰 Payment Logic

| Year | Amount |
|---|---|
| 1st Year | ₹150 |
| 2nd Year | ₹150 |
| 3rd Year | ₹400 |

Amount is auto-assigned and cannot be modified by the student.

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
id, name, email (UNIQUE), password, year, branch,
division, mobile, is_active
```

### audit_logs
```
id, action, performed_by, role, payment_id, usn,
reason, previous_values (JSONB), timestamp
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
│   ├── favicon.png          # Farewell event logo
│   └── logo-vtu.png         # Official VTU logo
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
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vtu-farewell-pay.git

# Navigate to project directory
cd vtu-farewell-pay

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

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

## 🔗 Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/submit` | Public | Student payment form |
| `/status` | Public | Payment status check |
| `/expenses` | Public | Financial transparency ledger |
| `/cr-login` | Public | CR login page |
| `/cr-access` | Public | CR credential retrieval |
| `/cr-dashboard` | CR only | CR verification dashboard |
| `/admin-login` | Hidden | Admin login (not in navbar) |
| `/admin-dashboard` | Admin only | Finance command center |

---

## 🔄 System Flow

```
Student fills 4-step form
        ↓
Pays via UPI QR or Cash
        ↓
Submits UTR (or CASH_USN for cash)
        ↓
Entry saved as PENDING
        ↓
┌───────────────────────────────┐
│ UPI Payment    │ Cash Payment │
│ Admin uploads  │ CR verifies  │
│ bank CSV       │ manually     │
│ System auto-   │ CR approves  │
│ approves match │ or rejects   │
└───────────────────────────────┘
        ↓
Status updates (Approved/Rejected/Disputed)
        ↓
Student checks status via USN
        ↓
All actions logged in audit_logs
```

---

## 📊 CSV Auto-Verification

The system supports automated UPI payment verification via bank statement CSV upload:

1. Admin uploads daily bank statement CSV
2. System normalizes UTR numbers (handles Excel scientific notation)
3. Matches student UTRs against bank Transaction IDs
4. Validates amount against Transaction Amount column
5. Auto-approves perfect matches (UTR + Amount both match)
6. Flags records where UTR matches but amount differs
7. Skips already-approved records (duplicate protection)
8. Logs all system actions in audit trail

**Expected CSV columns:**
```
Transaction Date and Time | Product | Received From |
Payment Mode | Transaction ID | Transaction Amount |
Net MDR (Inclusive GST) | Amount Added
```

---

## 🔐 Security Features

- Supabase Row Level Security (RLS) on all tables
- CR access scoped strictly to assigned year/branch/division
- Admin route not linked in navbar (security through obscurity)
- CR agreement gate before credential access
- Kill switch to disable all CR access instantly
- All destructive actions require confirmation modal
- Complete audit trail with JSONB previous values for edits

---

## 📱 Responsive Design

- **Desktop:** High-density data tables for professional use
- **Mobile:** Glass card layouts with no horizontal scroll
- **Navbar:** 3-zone desktop layout, hamburger menu on mobile
- **Forms:** Mobile-optimized step-by-step flow

---

## 🎬 Animations

- Cinematic page transitions (Framer Motion AnimatePresence)
- Floating neon orbs on landing page
- Staggered hero text reveal
- QR code fade-in on year change
- Pending badge breathing glow pulse
- Confetti on successful payment submission
- Shimmer skeleton loading states

---

## 📤 Export Features

- **Payments Export:** Full filtered payment dataset as CSV
- **Expense Export:** Full filtered expense ledger as CSV
- **Dynamic Filenames:** Date-stamped export files
- **CR Scoped Export:** CRs export only their class data

---

## 🏗️ State Machine

```
pending → approved (CR / System / Admin)
pending → rejected (CR / Admin)
approved → disputed (Admin only)
rejected → resubmitted → pending (Student, no cooldown)
```

---

## 🧑‍💻 Developed By

<div align="center">

**ONE RUPEE**
3rd Year, CSBS
Visvesvaraya Technological University, Belagavi

*Built with ❤️ for the Farewell of Batch 2022–23*

</div>

---

## 📄 License

This project is built for internal college use for the VTU Farewell '26 event.
Not licensed for commercial redistribution.

---

<div align="center">

**🎓 Farewell '26 — One Last Grand Celebration**
*Batch 2022–23 | 8th & 9th May 2026 | VTU, Belagavi*

</div>
````