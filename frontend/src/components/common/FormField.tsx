import type { InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  endAdornment?: ReactNode;
}

export default function FormField({
  label,
  error,
  hint,
  endAdornment,
  id,
  ...props
}: FormFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="form-group">
      <label htmlFor={fieldId}>{label}</label>
      {endAdornment ? (
        <div className="input-with-action">
          <input id={fieldId} aria-invalid={Boolean(error)} {...props} />
          {endAdornment}
        </div>
      ) : (
        <input id={fieldId} aria-invalid={Boolean(error)} {...props} />
      )}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
