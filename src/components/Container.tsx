import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  variant?: "page" | "content" | "fullscreen";
  className?: string;
}

export default function Container({
  children,
  variant = "content",
  className = "",
}: ContainerProps) {
  const variants = {
    page: "min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100",
    content: "mx-auto max-w-7xl px-6",
    fullscreen: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white",
  };
  
  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
