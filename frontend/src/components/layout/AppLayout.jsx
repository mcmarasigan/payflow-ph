import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Users,
  Landmark,
  Clock,
  Calculator,
  FileText,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Executive & Audit', icon: Building2, badge: 'Live', ready: true },
  { to: '/employees', label: 'Employee 201 Files', icon: Users, badge: 'Live', ready: true },
  { to: '/organization', label: 'Org & PH Holidays', icon: Landmark, badge: 'Live', ready: true },
  { to: '/attendance', label: 'Attendance & Leaves', icon: Clock, badge: 'Phase 3', ready: false },
  { to: '/payroll', label: 'Payroll Master Run', icon: Calculator, badge: 'Phase 4', ready: false },
  { to: '/portal', label: 'My Payslips & Portal', icon: FileText, badge: 'Phase 5', ready: false },
]

export default function AppLayout({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
              PF
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">PayFlow PH</div>
              <div className="text-[11px] text-slate-400 mt-1">HR & Payroll System</div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              if (!item.ready) {
                return (
                  <div
                    key={item.to}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-500">
                      {item.badge}
                    </span>
                  </div>
                )
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-indigo-500 text-white'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
          <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          <div className="mt-2.5 flex items-center justify-between">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              {user?.primary_role}
            </Badge>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <Badge variant="warning">Demonstration System</Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              Switch Demo Role
            </Button>
          </div>
        </header>

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
