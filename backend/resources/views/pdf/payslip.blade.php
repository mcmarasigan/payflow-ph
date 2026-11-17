<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payslip - {{ $item->employee_code }} - {{ $run->run_code }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1e293b;
            margin: 0;
            padding: 20px;
        }
        .header {
            border-bottom: 2px solid #312e81;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .company-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e1b4b;
        }
        .subtitle {
            font-size: 10px;
            color: #64748b;
        }
        .meta-table, .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .meta-table td {
            padding: 4px 6px;
            border: 1px solid #cbd5e1;
        }
        .meta-label {
            font-weight: bold;
            background-color: #f8fafc;
            color: #475569;
            width: 18%;
        }
        .meta-val {
            width: 32%;
        }
        .section-header {
            background-color: #1e1b4b;
            color: #ffffff;
            font-weight: bold;
            padding: 5px 8px;
            font-size: 10px;
            text-transform: uppercase;
        }
        .grid-table th, .grid-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
        }
        .grid-table th {
            background-color: #f1f5f9;
            text-align: left;
            font-size: 10px;
        }
        .right {
            text-align: right;
        }
        .net-box {
            background-color: #ecfdf5;
            border: 2px solid #059669;
            padding: 10px 14px;
            margin-top: 10px;
            margin-bottom: 14px;
        }
        .net-title {
            font-size: 12px;
            font-weight: bold;
            color: #065f46;
        }
        .net-amount {
            font-size: 16px;
            font-weight: bold;
            color: #047857;
            float: right;
        }
        .footer {
            margin-top: 18px;
            padding-top: 8px;
            border-top: 1px dashed #94a3b8;
            font-size: 9px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-title">PAYFLOW PH TECHNOLOGIES INC.</div>
        <div class="subtitle">
            Philippine Enterprise HR &amp; Statutory Payroll System • Confidential Electronic Payslip
        </div>
    </div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Employee Code</td>
            <td class="meta-val">{{ $item->employee_code }}</td>
            <td class="meta-label">Payroll Run</td>
            <td class="meta-val">{{ $run->run_code }} ({{ strtoupper($run->status) }})</td>
        </tr>
        <tr>
            <td class="meta-label">Employee Name</td>
            <td class="meta-val"><strong>{{ $item->employee_name }}</strong></td>
            <td class="meta-label">Cutoff Period</td>
            <td class="meta-val">{{ $run->period_start?->format('M d, Y') }} – {{ $run->period_end?->format('M d, Y') }}</td>
        </tr>
        <tr>
            <td class="meta-label">Department / Role</td>
            <td class="meta-val">{{ $item->department_name }} — {{ $item->position_title }}</td>
            <td class="meta-label">Pay Date</td>
            <td class="meta-val">{{ $run->pay_date?->format('M d, Y') }}</td>
        </tr>
        <tr>
            <td class="meta-label">Monthly Basic</td>
            <td class="meta-val">PHP {{ number_format((float) $item->monthly_basic_salary, 2) }}</td>
            <td class="meta-label">Daily / Hourly Rate</td>
            <td class="meta-val">PHP {{ number_format((float) $item->daily_rate, 2) }} / PHP {{ number_format((float) $item->hourly_rate, 2) }}</td>
        </tr>
    </table>

    <table class="grid-table">
        <thead>
            <tr>
                <th style="width: 34%;">EARNINGS &amp; ALLOWANCES</th>
                <th class="right" style="width: 16%;">AMOUNT (PHP)</th>
                <th style="width: 34%;">DEDUCTIONS &amp; STATUTORY SHARE</th>
                <th class="right" style="width: 16%;">AMOUNT (PHP)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basic Salary (Cutoff)</td>
                <td class="right">{{ number_format((float) $item->basic_pay, 2) }}</td>
                <td>SSS Employee Share (MSC {{ number_format((float) $item->sss_msc, 0) }})</td>
                <td class="right">{{ number_format((float) $item->sss_ee, 2) }}</td>
            </tr>
            <tr>
                <td>DOLE Overtime Pay ({{ number_format((float) $item->overtime_hours, 2) }} hrs)</td>
                <td class="right">{{ number_format((float) $item->overtime_pay, 2) }}</td>
                <td>PhilHealth Employee Share (2.5%)</td>
                <td class="right">{{ number_format((float) $item->philhealth_ee, 2) }}</td>
            </tr>
            <tr>
                <td>Night Shift Differential ({{ number_format((float) $item->night_diff_hours, 2) }} hrs @ 10%)</td>
                <td class="right">{{ number_format((float) $item->night_diff_pay, 2) }}</td>
                <td>Pag-IBIG / HDMF Employee Share</td>
                <td class="right">{{ number_format((float) $item->pagibig_ee, 2) }}</td>
            </tr>
            <tr>
                <td>PH Holiday Premium Pay</td>
                <td class="right">{{ number_format((float) $item->holiday_pay, 2) }}</td>
                <td>Late ({{ $item->late_minutes }}m) &amp; Undertime ({{ $item->undertime_minutes }}m)</td>
                <td class="right">{{ number_format((float) $item->late_undertime_deduction, 2) }}</td>
            </tr>
            <tr>
                <td>De Minimis Allowances (Non-Taxable)</td>
                <td class="right">{{ number_format((float) $item->de_minimis_allowance, 2) }}</td>
                <td>Leave Without Pay / LWOP ({{ number_format((float) $item->lwop_days, 1) }}d)</td>
                <td class="right">{{ number_format((float) $item->lwop_deduction, 2) }}</td>
            </tr>
            <tr>
                <td>Other Adjustments / 13th Month</td>
                <td class="right">{{ number_format((float) $item->thirteenth_month_pay, 2) }}</td>
                <td>BIR TRAIN Withholding Tax (Taxable: {{ number_format((float) $item->taxable_income, 2) }})</td>
                <td class="right">{{ number_format((float) $item->withholding_tax, 2) }}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f8fafc;">
                <td>TOTAL GROSS EARNINGS</td>
                <td class="right">PHP {{ number_format((float) $item->gross_pay, 2) }}</td>
                <td>TOTAL DEDUCTIONS</td>
                <td class="right">PHP {{ number_format((float) $item->total_deductions, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="net-box">
        <span class="net-title">NET TAKE-HOME PAY (DISBURSED VIA BANK PAYROLL):</span>
        <span class="net-amount">PHP {{ number_format((float) $item->net_pay, 2) }}</span>
        <div style="clear: both;"></div>
    </div>

    <div class="section-header">Employer Statutory Contributions (For Information Only — Not Deducted From Pay)</div>
    <table class="grid-table">
        <tr>
            <td><strong>SSS Employer Share (10%):</strong> PHP {{ number_format((float) $item->sss_er, 2) }}</td>
            <td><strong>SSS EC:</strong> PHP {{ number_format((float) $item->sss_ec, 2) }}</td>
            <td><strong>PhilHealth ER (2.5%):</strong> PHP {{ number_format((float) $item->philhealth_er, 2) }}</td>
            <td><strong>Pag-IBIG ER (2%):</strong> PHP {{ number_format((float) $item->pagibig_er, 2) }}</td>
            <td><strong>Total ER Share:</strong> PHP {{ number_format((float) $item->total_employer_cost, 2) }}</td>
        </tr>
    </table>

    <div class="footer">
        System-Generated Electronic Payslip • 2025/2026 Philippine Statutory Compliance (SSS RA 11199, PhilHealth 5% Circular, Pag-IBIG HDMF, BIR TRAIN Law RA 10963) • Portfolio Demonstration System using 100% Synthetic Data.
    </div>
</body>
</html>
