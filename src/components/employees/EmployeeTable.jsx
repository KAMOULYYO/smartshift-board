import { Edit2, Trash2, Mail, Phone, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import DepartmentBadge from '../ui/DepartmentBadge'
import { getRoleLabel } from '../../utils/permissions'
import { useApp } from '../../context/AppContext'
import { getTodayDate, calcShiftHours } from '../../utils/helpers'

function PresenceDot({ rate }) {
  if (rate === null) return <span className="text-xs text-gray-300">—</span>
  const color = rate >= 90 ? 'bg-green-400' : rate >= 70 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-semibold text-gray-600">{rate}%</span>
    </div>
  )
}

export default function EmployeeTable({ employees, onEdit, onDelete, canManage }) {
  const { shifts, absences } = useApp()
  const thisMonth = getTodayDate().slice(0, 7)

  const getStats = (empId) => {
    const empShifts   = shifts.filter(s => s.employeeId === empId && s.date.startsWith(thisMonth))
    const empAbsences = absences.filter(a => a.employeeId === empId && a.status === 'accepted')
    const hours = empShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)
    const allShifts = shifts.filter(s => s.employeeId === empId)
    const rate = allShifts.length > 0
      ? Math.round(((allShifts.length - empAbsences.length) / allShifts.length) * 100)
      : null
    return { shifts: empShifts.length, hours: Math.round(hours), rate }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="table-header">Employé</th>
            <th className="table-header hidden md:table-cell">Contact</th>
            <th className="table-header">Département</th>
            <th className="table-header hidden sm:table-cell">Rôle</th>
            <th className="table-header hidden lg:table-cell">Ce mois</th>
            <th className="table-header hidden lg:table-cell">Présence</th>
            <th className="table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {employees.map(emp => {
            const stats = getStats(emp.id)
            return (
              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="table-cell">
                  <Link to={`/employees/${emp.id}`} className="flex items-center gap-3 group/link">
                    <div className="w-9 h-9 rounded-xl gradient-red flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">{emp.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm group-hover/link:text-red-500 transition-colors">{emp.name}</p>
                      {emp.note && <p className="text-xs text-gray-400 truncate max-w-[160px]">{emp.note}</p>}
                    </div>
                  </Link>
                </td>
                <td className="table-cell hidden md:table-cell">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail size={12} className="text-gray-400" />
                      <span className="truncate max-w-[180px]">{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone size={12} className="text-gray-400" />
                        {emp.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  <DepartmentBadge department={emp.department} />
                </td>
                <td className="table-cell hidden sm:table-cell">
                  <span className="text-sm text-gray-600 font-medium capitalize">{getRoleLabel(emp.role)}</span>
                </td>
                <td className="table-cell hidden lg:table-cell">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{stats.shifts} shifts</p>
                    <p className="text-xs text-gray-400">{stats.hours}h planifiées</p>
                  </div>
                </td>
                <td className="table-cell hidden lg:table-cell">
                  <PresenceDot rate={stats.rate} />
                </td>
                <td className="table-cell text-right">
                  <div className="flex gap-1 justify-end items-center">
                    <Link
                      to={`/employees/${emp.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Voir le profil"
                    >
                      <ChevronRight size={15} />
                    </Link>
                    {canManage && (
                      <>
                        <button onClick={() => onEdit(emp)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => onDelete(emp)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
