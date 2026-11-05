import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Users,
  Calculator,
  CheckCircle2,
  UserCircle,
  Lock,
  Mail,
  ArrowRight,
  Building2,
} from 'lucide-react'

const DEMO_ACCOUNTS = [
  {
    role: 'Super Admin',
    name: 'Elena Valencia',
    email: 'admin@payflow.ph',
    badge: 'Full System & Statutory Tables',
    icon: ShieldCheck,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    role: 'HR Manager',
    name: 'Marco Villanueva',
    email: 'hr@payflow.ph',
    badge: '201 Files, DTR & Leave Policies',
    icon: Users,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  {
    role: 'Payroll Officer',
    name: 'Patricia Reyes',
    email: 'payroll@payflow.ph',
    badge: 'Computes Cutoff (Cannot Approve Own Run)',
    icon: Calculator,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    role: 'Approver / Finance',
    name: 'Carlos Mendoza',
    email: 'finance@payflow.ph',
    badge: 'Reviews Register & Releases Payout',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    role: 'Employee',
    name: 'Juan Dela Cruz',
    email: 'employee@payflow.ph',
    badge: 'Self-Service DTR, Leaves & PDF Payslips',
    icon: UserCircle,
    color: 'text-violet-600 bg-violet-50 border-violet-200',
  },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@payflow.ph')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickDemo = async (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password123')
    setError('')
    setSubmitting(true)
    try {
      await login(demoEmail, 'password123')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Left Column: Brand & Enterprise Architecture Highlights */}
      <div className="lg:w-7/12 p-8 lg:p-14 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">PayFlow PH</span>
              <span className="ml-2.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
                v1.0 Foundation
              </span>
            </div>
          </div>

          <div className="mt-10 max-w-xl">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 mb-4">
              Enterprise-Style Philippine HR & Payroll Demonstration System
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Philippine Statutory Payroll & HR Operations Platform
            </h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Engineered with strict separation of duties, bracket-accurate 2025 SSS Monthly Salary Credit schedules, tiered Pag-IBIG contributions, PhilHealth, BIR TRAIN withholding tax tables, and DOLE overtime multipliers.
            </p>
          </div>

          {/* 1-Click Role Switcher Cards */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1-Click Interactive Role Switcher (Synthetic Demo Accounts)
              </span>
              <span className="text-xs text-slate-500 font-mono">Password: password123</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((acct) => {
                const Icon = acct.icon
                const isSelected = email === acct.email
                return (
                  <button
                    key={acct.email}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemo(acct.email)}
                    className={`group text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/70 shadow-md'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-2 rounded-lg border ${acct.color}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {acct.role}
                          </div>
                          <div className="text-xs text-slate-400">{acct.name}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 truncate">
                      {acct.badge}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>100% Synthetic Fictional Employee Dataset (Zero Real PII)</span>
          <span>Laravel 13 API • React 19.3 • Spatie RBAC & Activitylog</span>
        </div>
      </div>

      {/* Right Column: Standard Sign-In Form */}
      <div className="lg:w-5/12 p-8 lg:p-14 flex items-center justify-center bg-white text-slate-900">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to PayFlow PH
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Use the 1-click role cards on the left or enter credentials manually below.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  placeholder="admin@payflow.ph"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-10 text-sm font-semibold"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Workspace'}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-800 mb-1">
              Separation of Duties Policy
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In PayFlow PH, the <strong>Payroll Officer</strong> computes and submits payroll runs, while only <strong>Approver / Finance</strong> can authorize and release payouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
