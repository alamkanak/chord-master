"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { TerminologyEntry } from "@/utils/chordSvg";

interface ChordExplainerProps {
  /** The chord name, e.g. "Am7", "Dsus4" */
  chordName: string;
  /** The resolved terminology entries for this chord's tags */
  entries: TerminologyEntry[];
}

/**
 * A subtle info button that opens an animated popover explaining
 * what the chord name's components mean (e.g. "m" = minor, "7" = dominant 7th).
 */
export default function ChordExplainer({ chordName, entries }: ChordExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsVisible(false);
    // Wait for the fade-out transition before unmounting
    setTimeout(() => setIsOpen(false), 150);
  }, []);

  // Trigger the visible state after mount so the transition plays
  useEffect(() => {
    if (isOpen) {
      // Request animation frame ensures the initial (invisible) state is painted first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  if (entries.length === 0) return null;

  return (
    <>
      {/* Info trigger button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="p-1.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-all duration-200 cursor-pointer"
        aria-label={`What does ${chordName} mean?`}
        title="What does this chord name mean?"
      >
        <InformationCircleIcon className="h-5 w-5" />
      </button>

      {/* Popover overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-100 transition-colors duration-150 ${isVisible ? "bg-black/10" : "bg-transparent"}`}
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
        >
          {/* Popover card — positioned over the chord card */}
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className={`fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-105 z-101 transition-all duration-150 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">
                    Chord Breakdown
                  </p>
                  <h3 className="text-white text-xl font-bold mt-0.5">
                    {chordName}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                  }}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Entries */}
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {entries.map((entry, i) => (
                  <div key={entry.label} className={i > 0 ? "pt-4 border-t border-slate-100" : ""}>
                    {/* Tag pill + label */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {entry.symbol && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                          {entry.symbol}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-900">
                        {entry.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {entry.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
