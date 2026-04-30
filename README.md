Since you've built a high-end, cinematic project, your GitHub README should look
just as professional. A great README not only documents the project but also
acts as a portfolio piece for you as a developer.

I have written a Comprehensive, Professional README. It includes sections for
the tech stack, the a unique "Business Logic" section (to highlight the
resubmission and security features), and clear setup instructions.

Create a file named README.md in your root folder and paste this entire block:

# 🎓 Farewell '26 | Payment Management System
**Institution:** Visvesvaraya Technological University (VTU), Belagavi  
**Event:** Farewell Day for the 4th Year Batch of 2022–23  
**Deployment:** https://vtu-farewell-pay.vercel.app/

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img,shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![FramerMotion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer-motion&logoColor=white)

---

## 🌟 Project Overview
The **Farewell '26 Payment Management System** is a full-stack, production-grade application designed to streamline the collection and verification of event fees. The system replaces messy manual spreadsheets with a cinematic, automated pipeline that connects students, Class Representatives (CRs), and the Finance Head (Admin).

### 🎨 UI/UX Design Philosophy
The application follows a **Cinematic Dark Theme**, utilizing:
- **Glassmorphism:** Frosted-glass containers with `backdrop-blur` for a modern, depth-filled feel.
- **Neon Aesthetics:** High-contrast Neon Cyan and Neon Violet accents to guide the user's eye.
- **Fluid Motion:** Powered by `Framer Motion` for smooth page transitions, button micro-interactions, and a high-end "app-like" feel.

---

## 🚀 Core Features

### 🎓 Student Experience
- **3-Step Payment Journey:** Personal Details $\rightarrow$ Dynamic QR Payment $\rightarrow$ Proof Upload.
- **Smart Logic:** 
  - Automatic fee assignment based on the student's year (₹100/₹400).
  - Real-time duplicate checks for USN and UTR to prevent double entries.
- **Dynamic UPI Integration:** Generates a real-time UPI QR code with a custom payment note (`USN_NAME`).
- **Live Status Tracker:** Students can track their verification progress (Pending / Approved / Rejected / Disputed).
- **Resubmission Flow:** If a payment is rejected, students can resubmit new details without creating duplicate entries.

### 👥 CR Portal (Scoped Management)
- **Secure Login:** CR-specific access controlled by the Admin.
- **Scoped Dashboard:** CRs can ONLY see and manage students from their assigned Year, Branch, and Division.
- **One-Click Verification:** Approve or Reject payments with specific reasons.
- **Consistency Check:** Display of the "Expected Note" vs. the UTR to ensure accuracy.

### 🧑‍💼 Finance Command Center (Admin)
- **Global Oversight:** View all payments across all years and branches with powerful filters.
- **Override Authority:** Ability to mark any payment as "Disputed" for a secondary audit.
- **CR Governance:** Manual creation and management of CR accounts.
- **Detailed Audit Logs:** Every action (Approved/Rejected/Edited) is logged with timestamps and actors for 100% transparency.
- **Export System:** One-click export of all approved payments to a professional CSV/Excel format for bank reconciliation.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | High-performance UI rendering |
| **Styling** | Tailwind CSS | Custom Neon-Glass design system |
| **Animation** | Framer Motion | Cinematic transitions and effects |
| **Backend/DB** | Supabase | PostgreSQL Database & Real-time API |
| **Auth** | Supabase Auth | Secure Session management for Admin/CR |
| **Storage** | Supabase Storage | Hosting payment screenshot proofs |
| **Utilities** | `qrcode.react`, `canvas-confetti` | QR generation & UX celebration |

---

## 🏗️ System Architecture

### Database Schema
- `payments`: Stores student details, UTR, amount, and current status.
- `cr_accounts`: Stores authorized CR credentials and their specific scope (Year/Branch/Div).
- `audit_logs`: A JSONB-powered log tracking every state change in the system.

### Security Implementation
- **Row Level Security (RLS):** Database-level policies ensure that students cannot view other students' details and CRs cannot access Admin settings.
- **API Validation:** Backend-level validation prevents frontend manipulation of payment amounts.
- **Private Routing:** Admin and CR portals are protected via custom session wrappers.

---

## ⚙️ Installation & Setup

### 1. Clone the project
```bash
git clone https://github.com/SVM3116/vtu-farewell-pay.git
cd vtu-farewell-pay

2. Install Dependencies

npm install

3. Environment Variables

Create a .env file in the root directory:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Database Setup

Run the provided SQL scripts in your Supabase SQL editor to create the payments,
cr_accounts, and audit_logs tables.

5. Run the App

npm run dev

🤝 Contributing

This project was built as an institutional tool for VTU Belagavi. If you wish to
suggest features or improvements, feel free to open an issue or a pull request.

Built with ❤️ for the Batch of 2022-23.

