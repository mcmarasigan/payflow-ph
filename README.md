# PayFlow PH — Enterprise Philippine HR & Statutory Payroll System

**PayFlow PH** is a full-stack Philippine Human Resource Information System (HRIS) and Statutory Payroll Computation Platform engineered with **Laravel 13**, **React 19**, and **Tailwind CSS v4**.

> **Portfolio & Privacy Disclaimer:** This system uses **100% synthetic Filipino employee data** (`EMP-2026-001` through `EMP-2026-010`) and is built as a full-stack software engineering demonstration of Philippine statutory compliance, role-based separation of duties, encrypted PII storage, and immutable financial workflows.

---

## Key Features & Philippine Statutory Compliance (2025/2026)

1. **2025/2026 Philippine Statutory Payroll Engine ([`PhilippinePayrollCalculator.php`](./backend/app/Services/PhilippinePayrollCalculator.php))**:
   - **SSS (RA 11199 — 2025/2026 Schedule)**: **15% total contribution rate** (**5% Employee Share / 10% Employer Share**) across Monthly Salary Credits (**₱5,000 – ₱35,000 MSC ceiling**, split into Regular SSS up to ₱20k + Mandatory Provident Fund / WISP from ₱20.5k to ₱35k) plus **₱10/₱30 Employer EC**.
   - **PhilHealth (2025/2026 Circular)**: **5.0% premium rate** split equally (**2.5% EE / 2.5% ER**) with a **₱10,000 floor** and **₱100,000 salary ceiling**.
   - **Pag-IBIG / HDMF (2024–2026 Schedule)**: Tiered **1% EE / 2% ER** (for Monthly Basic ≤ ₱1,500) and **2% EE / 2% ER** (for Monthly Basic > ₱1,500) with a **₱10,000 Maximum Fund Salary (MFS) cap** (₱200 max EE / ₱200 max ER).
   - **BIR Withholding Tax (TRAIN Law — RA 10963 Effective 2023–2026)**: Progressive semi-monthly and monthly tax table (**0% tax-exempt up to ₱250,000/year**, scaling from **15% to 35%**) computed after deducting tardiness, undertime, unpaid LWOP, and mandatory SSS/PhilHealth/Pag-IBIG EE shares. Non-taxable **De Minimis benefits** (Rice, Clothing, Laundry, Medical) are excluded from taxable income.
   - **13th Month Pay (PD 851 & ₱90,000 Exemption Ceiling)**: Pro-rata computation (`Total Basic Salary Earned ÷ 12`) tracking the tax-exempt portion (up to ₱90,000) and any taxable excess.

2. **DOLE Overtime Multiplier Matrix & Night Shift Differential ([`TimeAndLeaveController.php`](./backend/app/Http/Controllers/Api/TimeAndLeaveController.php))**:
   - Automatic workday classification against the **2026 Official Philippine Holiday Calendar**:
     - Ordinary Workday OT: **`1.25x` (125%)**
     - Rest Day / Special Non-Working Day OT: **`1.69x` (169% = 130% × 130%)**
     - Special Non-Working Day on Rest Day OT: **`1.95x` (195% = 150% × 130%)**
     - Regular Holiday OT: **`2.60x` (260% = 200% × 130%)**
     - Regular Holiday on Rest Day OT: **`3.38x` (338% = 260% × 130%)**
   - **Night Shift Differential (NSD)**: Automatic **`+10%`** premium computation for hours worked between **10:00 PM and 6:00 AM**.

3. **Statutory SIL vs Configurable Company Leave Policies**:
   - Distinguishes between **Philippine Statutory Leaves** (`SIL` 5-day Service Incentive Leave under Labor Code Art. 95, `MAT` 105-day Expanded Maternity Leave RA 11210, `PAT` 7-day Paternity Leave RA 8187, `SOLO` 7-day Solo Parent Leave RA 8972) and **Configurable Company-Granted Leaves** (`VL`, `SL`, and unpaid `LWOP` which automatically deducts from the semi-monthly payroll cutoff).

4. **Strict Separation of Duties, RBAC & Immutable Payroll Runs**:
   - **5 Spatie Permission Roles**: `Super Admin`, `HR Manager`, `Payroll Officer`, `Approver / Finance`, and `Employee`.
   - **Separation of Duties**: A `Payroll Officer` can prepare and compute a cutoff (`Draft → Computed`), but **cannot** approve it. An `Approver / Finance` controller reviews, approves, and locks the run (`Computed → Approved → Locked`), but **cannot** alter or recompute figures.
   - **Immutability**: Once a payroll run is `approved` or `locked`, it is cryptographically/database-locked (`422 Unprocessable Entity` on recompute attempts).
   - **AES-256 Encrypted Statutory IDs & Masking**: SSS, PhilHealth, Pag-IBIG, TIN, and Bank Account numbers use Laravel `encrypted` casts at rest and are masked (`34-****-12`) for unauthorized roles.
   - **Printable DomPDF Payslips & BIR Form 2316 YTD Summary**: Employees can inspect itemized payslips and download official A4 PDF payslips.

---

## Quick Start (Single Terminal)

From the root folder (`D:\payflow-ph`):

```bash
# Start both Laravel API (http://127.0.0.1:8000) and React Vite UI (http://localhost:5173)
npm run serve
```

### Demo Accounts (1-Click Role Switcher on Login Screen)
All demo accounts use password: `password123`
- **Super Admin**: `admin@payflow.ph` (Elena Valencia)
- **HR Manager**: `hr@payflow.ph` (Marco Villanueva)
- **Payroll Officer**: `payroll@payflow.ph` (Patricia Reyes)
- **Approver / Finance**: `finance@payflow.ph` (Carlos Mendoza)
- **Employee Self-Service**: `employee@payflow.ph` (Juan Dela Cruz — `EMP-2026-001`)

### Running Automated Tests
```bash
cd backend
php artisan test
# 14 passed (100 assertions)
```
