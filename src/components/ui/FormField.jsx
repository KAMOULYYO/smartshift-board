export function FormField({ label, error, required, children, hint }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={`input-field ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`select-field ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`input-field resize-none ${className}`} {...props} />
}
