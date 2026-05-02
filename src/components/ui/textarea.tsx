import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helperText?: string
  error?: string
  wrapperClassName?: string
}

export function Textarea({
  label,
  helperText,
  error,
  disabled,
  className = '',
  wrapperClassName = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || props.name

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-50' : ''} ${wrapperClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        disabled={disabled}
        className={`w-full resize-none rounded-md border bg-zinc-50 px-5 py-3 text-sm text-foreground placeholder:text-placeholder transition-colors duration-100 focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed ${
          error
            ? 'border-error-border focus:border-error-text focus:ring-error-text'
            : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-error-text">{error}</p>}
      {!error && helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
    </div>
  )
}
