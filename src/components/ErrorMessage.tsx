"use client";

interface Props {
  message: string;
  type?: "error" | "warning" | "info";
}

const styles = {
  error: "bg-red-50 border-red-200 text-red-700",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
};

const icons = {
  error: (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8V6a1 1 0 112 0v4a1 1 0 11-2 0zm1 4a1.25 1.25 0 110-2.5A1.25 1.25 0 0110 14z"
        clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-5a1 1 0 112 0v2a1 1 0 11-2 0V8z"
        clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 8a1 1 0 01-1-1V9a1 1 0 112 0v4a1 1 0 01-1 1z"
        clipRule="evenodd" />
    </svg>
  ),
};

export default function ErrorMessage({ message, type = "error" }: Props) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${styles[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}
