import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "secondary-gray" | "danger" | "pill" | "chord-selector";
  size?: "sm" | "md" | "lg";
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
  selected?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  href,
  icon,
  children,
  className = "",
  selected = false,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center gap-2 font-semibold transition-all cursor-pointer";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
    secondary: "rounded-lg border border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-slate-400 transition-colors active:scale-95",
    "secondary-gray": "bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg active:scale-95",
    danger: "bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 hover:text-red-200 rounded-lg active:scale-95",
    pill: `rounded-full border transition-all active:scale-95 ${
      selected 
        ? "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200 hover:border-blue-300" 
        : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300"
    }`,
    "chord-selector": `group rounded-xl border-2 p-4 transition-all duration-200 active:scale-95 hover:scale-105 ${
      selected
        ? "border-blue-500 bg-blue-50 shadow-lg"
        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
    }`,
  };
  
  const sizeClasses = {
    sm: variant === "pill" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        {icon}
      </Link>
    );
  }
  
  return (
    <button className={classes} {...props}>
      {children}
      {icon}
    </button>
  );
}
