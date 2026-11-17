
# PayFlow PH — Philippine HRIS & Statutory Payroll System

**PayFlow PH** is a full-stack Philippine Human Resource Information System (HRIS) and Statutory Payroll Computation Platform built with **Laravel 13, React 19, and Tailwind CSS v4**.

> **Portfolio & Privacy Disclaimer:** This project uses 100% synthetic Filipino employee data (`EMP-2026-001` through `EMP-2026-010`). It demonstrates Philippine payroll computations, employee management, role-based access control, data protection, and payroll approval workflows. It is not an official government payroll system or a substitute for professional payroll and tax advice.

---

## Key Features & Philippine Statutory Compliance

### 1. Philippine Statutory Payroll Engine

[PhilippinePayrollCalculator.php](https://github.com/mcmarasigan/payflow-ph/blob/master/backend/app/Services/PhilippinePayrollCalculator.php)

Implements configurable Philippine payroll computations based on the statutory schedules and references used in the project.

- **SSS (RA 11199 — 2025 Contribution Schedule)**
  - 15% total contribution rate.
  - 5% employee share and 10% employer share.
  - ₱5,000 minimum and ₱35,000 maximum contribution MSC.
  - Includes Regular SSS, Mandatory Provident Fund (MPF/WISP), and employer Employees' Compensation (EC) contributions.
  - Source: [SSS 2025 Contribution Table](https://www.sss.gov.ph/wp-content/uploads/2024/12/2025-SSS-Contribution-Table-rev.pdf)

- **PhilHealth (2025 Premium Schedule)**
  - 5% premium rate.
  - 2.5% employee share and 2.5% employer share.
  - ₱10,000 income floor and ₱100,000 income ceiling.
  - Source: [PhilHealth Advisory No. 2025-0002](https://www.philhealth.gov.ph/advisories/2025/PA2025-0002.pdf)

- **Pag-IBIG / HDMF (Circular No. 460)**
  - 1% employee and 2% employer contribution for monthly compensation of ₱1,500 and below.
  - 2% employee and 2% employer contribution for monthly compensation above ₱1,500.
  - ₱10,000 Maximum Fund Salary (MFS) used in the project's contribution computation.
  - Source: [Pag-IBIG Fund Official Circulars](https://www.pagibigfund.gov.ph/about_publication_circulars_memberservices.html)

- **BIR Withholding Tax — TRAIN Law (RA 10963)**
  - Implements progressive income tax brackets effective January 1, 2023.
  - Applies the 0% bracket to annual taxable income not exceeding ₱250,000.
  - Applies progressive tax rates from 15% to 35% to higher taxable income brackets.
  - Accounts for applicable mandatory employee contributions and configured taxable and non-taxable compensation items.
  - Source: [BIR Tax Rate Tables](https://efps.bir.gov.ph/efps-war/EFPSWeb_war/forms2018Version/1701Q/1701q_v3_02.xhtml)

- **13th Month Pay (PD 851)**
  - Computes 13th month pay using total basic salary earned divided by 12.
  - Tracks the ₱90,000 tax-exempt threshold for qualifying 13th month pay and other benefits combined.
  - Source: [DOLE — Guidelines on 13th Month Pay](https://dole.gov.ph/news/labor-advisory-no-21-26-guidelines-on-the-payment-of-thirteenth-month-pay/)

### 2. DOLE Overtime & Night Shift Differential

[TimeAndLeaveController.php](https://github.com/mcmarasigan/payflow-ph/blob/master/backend/app/Http/Controllers/Api/TimeAndLeaveController.php)

Includes automatic workday classification and configurable overtime computations based on Philippine labor standards.

**Implemented overtime multipliers:**

| Work Classification | Overtime Multiplier |
|---|---:|
| Ordinary Workday | 1.25x |
| Rest Day / Special Non-Working Day | 1.69x |
| Special Non-Working Day on Rest Day | 1.95x |
| Regular Holiday | 2.60x |
| Regular Holiday on Rest Day | 3.38x |

- **Night Shift Differential (NSD):** Additional 10% for qualifying hours worked between 10:00 PM and 6:00 AM.
- Uses the configured Philippine holiday calendar to classify work dates.
- Supports overtime and night shift calculations based on the applicable workday classification.

**References:**
- [DOLE — Guide to Employee Benefits](https://car.dole.gov.ph/news/guide-to-employee-benefits/)
- [Workers' Statutory Monetary Benefits Handbook](https://nwpc.dole.gov.ph/wp-content/uploads/2024/11/Workers-Statutory-Monetary-Benefits-Handbook-2024-Edition.pdf)
- [Official Gazette — Executive Issuances](https://officialgazette.gov.ph/section/executive-issuances/)

### 3. Statutory Leave & Company Leave Management

Separates statutory leave benefits from configurable company-granted leave credits.

**Statutory leave categories include:**

- **SIL:** Five-day Service Incentive Leave, subject to applicable eligibility rules and exemptions under Article 95 of the Labor Code.
- **MAT:** 105-day Expanded Maternity Leave under RA 11210, subject to applicable qualifications.
- **PAT:** Seven-day Paternity Leave under RA 8187, subject to statutory eligibility conditions.
- **SOLO:** Seven-day Solo Parent Leave under RA 8972, as amended by RA 11861, subject to eligibility requirements.

**Configurable company leave categories:**

- Vacation Leave (VL)
- Sick Leave (SL)
- Leave Without Pay (LWOP)

LWOP records are included in the payroll computation workflow for applicable salary deductions.

**References:**
- [RA 11210 — Expanded Maternity Leave Law](https://lawphil.net/statutes/repacts/ra2019/ra_11210_2019.html)
- [RA 8187 — Paternity Leave Act](https://lawphil.net/statutes/repacts/ra1996/ra_8187_1996.html)
- [RA 8972 — Solo Parents' Welfare Act](https://lawphil.net/statutes/repacts/ra2000/ra_8972_2000.html)
- [RA 11861 — Expanded Solo Parents Welfare Act](https://lawphil.net/statutes/repacts/ra2022/irr_8972_2022.html)
- [Philippine Labor Code — Lawphil](https://lawphil.net/statutes/presdecs/pd1974/pd_442_1974.html)

### 4. Role-Based Access Control & Immutable Payroll Workflow

Implements role-based permissions using Spatie Laravel Permission.

**Five system roles:**
- Super Admin
- HR Manager
- Payroll Officer
- Approver / Finance
- Employee

**Separation of Duties:**

- Payroll Officers can prepare and compute payroll runs (`Draft → Computed`).
- Finance Approvers can review, approve, and lock payroll runs (`Computed → Approved → Locked`).
- Payroll Officers cannot approve their own payroll runs.
- Approved or locked payroll runs cannot be recomputed through the application workflow.
- Recompute attempts on finalized payroll runs return `422 Unprocessable Entity`.

**Data Protection & Audit Controls:**

- Uses Laravel encrypted model casts for sensitive statutory identification numbers and bank account details.
- Masks sensitive employee information in applicable views.
- Uses Spatie activity logging to record important system actions.
- Maintains payroll computation details for review and traceability.

### 5. Employee Self-Service Portal & PDF Payslips

- Employee self-service portal for viewing personal employment information.
- Itemized payroll earnings and statutory deductions.
- Downloadable A4 PDF payslips generated using DomPDF.
- BIR Form 2316 year-to-date compensation and withholding tax summary.
- Employee profile with masked sensitive information.
- Leave credit and recent Daily Time Record (DTR) views.

### 6. Executive Payroll & Compliance Analytics

- Department payroll cost breakdown.
- Government statutory remittance summaries for SSS, PhilHealth, Pag-IBIG, and BIR.
- Payroll run monitoring.
- Audit trail visibility.
- Role-based permission overview.

---

## Technology Stack

| Category | Technologies |
|---|---|
| Backend | Laravel 13, PHP |
| Frontend | React 19, JavaScript |
| Styling | Tailwind CSS v4 |
| Database | MySQL |
| Authentication | Laravel Sanctum |
| Authorization | Spatie Laravel Permission |
| PDF Generation | DomPDF |
| Testing | PHPUnit |
| Build Tool | Vite |
| Version Control | Git, GitHub |

---

## Quick Start

### Prerequisites

- PHP and Composer
- Node.js and npm
- MySQL

### Run the Application

From the project root (`D:\payflow-ph`):

```bash
npm install
npm run serve
```

This starts the Laravel API and React Vite frontend, provided the root npm script is configured to launch both services.

### Demo Accounts

All demo accounts use the password `password123`.

| Role | Email | Demo User |
|---|---|---|
| Super Admin | admin@payflow.ph | Elena Valencia |
| HR Manager | hr@payflow.ph | Marco Villanueva |
| Payroll Officer | payroll@payflow.ph | Patricia Reyes |
| Approver / Finance | finance@payflow.ph | Carlos Mendoza |
| Employee | employee@payflow.ph | Juan Dela Cruz |

**Security Note:** These credentials are for local demonstration only. Do not use them in production.

### Run Automated Tests

```bash
cd backend
php artisan test
```

**Latest reported test result:** 14 tests passed, 100 assertions.

---

## Official References & Legal Sources

The statutory computations in this project are based on the following government publications and legal references.

| Agency / Source | Reference | Purpose |
|---|---|---|
| SSS | [2025 Contribution Table](https://www.sss.gov.ph/wp-content/uploads/2024/12/2025-SSS-Contribution-Table-rev.pdf) | SSS contribution rates and MSC |
| SSS | [Contribution Guidelines](https://www.sss.gov.ph/pay-contribution/) | Employer and employee contributions |
| PhilHealth | [Advisory No. 2025-0002](https://www.philhealth.gov.ph/advisories/2025/PA2025-0002.pdf) | 2025 premium rate and salary limits |
| Pag-IBIG | [Official Circulars](https://www.pagibigfund.gov.ph/about_publication_circulars_memberservices.html) | Circular No. 460 and MFS adjustment |
| BIR | [Tax Rate Tables](https://efps.bir.gov.ph/efps-war/EFPSWeb_war/forms2018Version/1701Q/1701q_v3_02.xhtml) | TRAIN Law income tax brackets |
| DOLE | [13th Month Pay Guidelines](https://dole.gov.ph/news/labor-advisory-no-21-26-guidelines-on-the-payment-of-thirteenth-month-pay/) | 13th month pay computation |
| DOLE | [Guide to Employee Benefits](https://car.dole.gov.ph/news/guide-to-employee-benefits/) | Overtime, holiday pay, and night shift differential |
| DOLE / NWPC | [Workers' Statutory Monetary Benefits Handbook](https://nwpc.dole.gov.ph/wp-content/uploads/2024/11/Workers-Statutory-Monetary-Benefits-Handbook-2024-Edition.pdf) | Statutory monetary benefits |
| Official Gazette | [Executive Issuances](https://officialgazette.gov.ph/section/executive-issuances/) | Official holiday proclamations |
| Lawphil | [Republic Acts and Legal References](https://lawphil.net/statutes/repacts/) | Philippine labor and statutory leave laws |

**Important:** Government contribution rates, tax tables, benefit rules, and holiday declarations may change. The figures implemented in this demonstration reflect the specific schedules configured in the application. Verify the latest applicable government issuances before using the system for actual payroll processing.

---

## Project Disclaimer

PayFlow PH is an independent portfolio project created for educational and software engineering demonstration purposes.

It is not affiliated with, endorsed by, or connected to SSS, PhilHealth, Pag-IBIG, BIR, or DOLE.

All employee records and demo credentials are synthetic. No real employee personal information or financial records are used.
