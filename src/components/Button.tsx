import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "secondary-gray" | "danger" | "pill" | "chord-selector" | "icon" | "ghost" | "filter" | "pattern-selector" | "duration";
  size?: "sm" | "md" | "lg";
  href?: string;
  icon?: ReactNode;
  children?: ReactNode;
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
    primary: "bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl",
    secondary: "rounded-lg border border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-slate-400 transition-colors",
    "secondary-gray": "bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg",
    danger: "bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 hover:text-red-200 rounded-lg",
    pill: `rounded-full border transition-all ${
      selected 
        ? "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200 hover:border-blue-300" 
        : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300"
    }`,
    "chord-selector": `group rounded-xl border-2 p-4 transition-all duration-200 ${
      selected
        ? "border-blue-500 bg-blue-50 shadow-lg"
        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
    }`,
    icon: "justify-center rounded-full transition-colors text-slate-400 hover:bg-white/10 hover:text-white",
    ghost: "text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors",
    filter: `rounded-md text-xs font-semibold transition-all ${
      selected
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-700"
    }`,
    "pattern-selector": `group text-left rounded-xl border-2 p-5 transition-all duration-200 ${
      selected
        ? "border-blue-500 bg-blue-50 shadow-lg"
        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
    }`,
    duration: `rounded-lg text-xs font-semibold transition-all ${
      selected
        ? "bg-blue-600 text-white shadow-md border border-blue-600"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
    }`,
  };
  
  const sizeClasses = {
    sm: variant === "pill" ? "px-3 py-1.5 text-sm"
      : variant === "icon" ? "h-10 w-10"
      : variant === "ghost" ? "p-0"
      : variant === "filter" ? "px-2 py-1"
      : variant === "duration" ? "px-3 py-1.5"
      : "px-4 py-2 text-sm",
    md: variant === "icon" ? "h-12 w-12" : "px-6 py-3 text-base",
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
