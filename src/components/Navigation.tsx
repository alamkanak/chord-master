import Link from "next/link";
import { MusicalNoteIcon } from "@heroicons/react/24/solid";

interface NavigationProps {
  subtitle: string;
  zIndex?: "z-50" | "z-40";
}

export default function Navigation({ subtitle, zIndex = "z-50" }: NavigationProps) {
  return (
    <nav className={`sticky top-0 ${zIndex} border-b border-slate-200/50 bg-white/40 backdrop-blur-xl`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <div className="h-9 w-9 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 shadow-lg flex items-center justify-center">
            <MusicalNoteIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Guitar Gym</span>
        </Link>
        <div className="text-sm font-medium text-slate-500">{subtitle}</div>
      </div>
    </nav>
  );
}
