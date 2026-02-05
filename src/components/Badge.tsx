import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "info";
  icon?: ReactNode;
  animated?: boolean;
}

export default function Badge({
  children,
  variant = "primary",
  icon,
  animated = false,
}: BadgeProps) {
  const variants = {
    primary: "inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 border border-blue-200",
    info: "inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 border border-slate-200",
  };
  
  return (
    <div className={variants[variant]}>
      {icon && (
        <span className={animated ? "w-2 h-2 rounded-full bg-blue-600 animate-pulse" : ""}>
          {icon}
        </span>
      )}
      <span className="text-sm font-semibold text-blue-700">{children}</span>
    </div>
  );
}
