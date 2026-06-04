import { Edit2, Trash2, Mail, Phone } from 'lucide-react'
import DepartmentBadge from '../ui/DepartmentBadge'
import { getRoleLabel } from '../../utils/permissions'

export default function EmployeeTable({ employees, onEdit, onDelete, canManage }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="table-header">Employé</th>
            <th className="table-header hidden md:table-cell">Contact</th>
            <th className="table-header">Département</th>
            <th className="table-header hidden sm:table-cell">Rôle</th>
            {canManage && <th className="table-header text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {employees.map(emp => (
            <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="table-cell">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl gradient-red flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{emp.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                    {emp.note && <p className="text-xs text-gray-400 truncate max-w-[160px]">{emp.note}</p>}
                  </div>
                </div>
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
              {canManage && (
                <td className="table-cell text-right">
                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(emp)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(emp)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
