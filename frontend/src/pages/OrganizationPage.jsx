import { useEffect, useState } from 'react'
import api from '@/lib/api'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Landmark, CalendarDays, Briefcase } from 'lucide-react'

export default function OrganizationPage() {
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [holidays, setHolidays] = useState([])

  useEffect(() => {
    api.get('/organization').then(({ data }) => {
      setDepartments(data.departments || [])
      setPositions(data.positions || [])
      setHolidays(data.holidays || [])
    })
  }, [])

  return (
    <AppLayout
      title="Organization Structure & Philippine Holidays"
      subtitle="Departments, job levels, and DOLE statutory holiday multipliers (Regular 200% vs Special Non-Working 130%)."
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
        {/* Internally Scrollable Departments & Positions Card */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100 shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Landmark className="h-4 w-4 text-indigo-600" />
              Departments & Job Positions ({departments.length})
            </CardTitle>
            <CardDescription>
              Cost-center departments and standardized role levels
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
            {departments.map((dept) => (
              <div key={dept.id} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 mr-2">
                      [{dept.code}]
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{dept.name}</span>
                  </div>
                  <Badge variant="secondary">{dept.employees_count} Staff</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{dept.description}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {positions
                    .filter((p) => p.department_id === dept.id)
                    .map((pos) => (
                      <Badge key={pos.id} variant="default" className="text-[11px]">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {pos.title} ({pos.level})
                      </Badge>
                    ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Internally Scrollable 2026 Philippine Holiday Matrix */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100 shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-600" />
              2026 Philippine Statutory Holidays ({holidays.length})
            </CardTitle>
            <CardDescription>
              Used automatically by the Payroll Engine for holiday pay & DOLE overtime multipliers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Holiday Name</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4 text-right">DOLE Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">{h.date}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{h.name}</td>
                    <td className="py-2.5 px-4">
                      {h.type === 'regular' ? (
                        <Badge variant="danger">Regular Holiday</Badge>
                      ) : (
                        <Badge variant="warning">Special Non-Working</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {h.type === 'regular' ? '200% (OT: 260%)' : '130% (OT: 169%)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
