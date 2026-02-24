import Link from "next/link";
import { MusicalNoteIcon } from "@heroicons/react/24/solid";

interface NavigationProps {
  subtitle: string;
  zIndex?: "z-50" | "z-40";
}

export default function Navigation({ subtitle, zIndex = "z-50" }: NavigationProps) {
  return (
    <nav className={`sticky top-0 ${zIndex} border-b border-slate-200/50 bg-white/40 backdrop-blur-xl`}>
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 hover:opacity-85 transition-opacity shrink-0"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 shadow-lg flex items-center justify-center">
            <MusicalNoteIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900 whitespace-nowrap">Guitar Gym</span>
        </Link>
        <div className="text-xs sm:text-sm font-medium text-slate-500 truncate">{subtitle}</div>
      </div>
    </nav>
  );
}
