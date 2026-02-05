"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700" />
            <span className="text-lg font-bold text-slate-900">Chord Master</span>
          </div>
          <div className="text-sm text-slate-600">Learn Guitar the Smart Way</div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-900 md:text-6xl">
              Master Chord Changes
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-slate-600">
              Scientific practice drills to build muscle memory and speed. Perfect for beginners.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon="🎸"
              title="Chord Practice"
              description="Select multiple chords and practice smooth transitions with a 1-minute timed drill"
            />
            <FeatureCard
              icon="🎯"
              title="Focused Training"
              description="Built specifically for beginners to develop finger placement and change speed"
            />
            <FeatureCard
              icon="📱"
              title="Practice Anywhere"
              description="Works on mobile like a native app. Save to your home screen and practice offline"
            />
          </div>

          {/* CTA Button */}
          <div className="mt-12">
            <Link
              href="/chords"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Practice Chord Changing
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Upcoming Features Section */}
        <div className="mt-24 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">
            Coming Soon
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <UpcomingFeature
              icon="🎵"
              title="Practice Session Builder"
              description="Create custom practice sessions with multiple exercises and track progress"
            />
            <UpcomingFeature
              icon="🎪"
              title="Finger Gym"
              description="Exercises to build finger strength and flexibility"
            />
            <UpcomingFeature
              icon="🎶"
              title="Song Follow-Along"
              description="Practice chords in the context of real songs"
            />
            <UpcomingFeature
              icon="🥁"
              title="Beat Sync"
              description="Practice chord changes in rhythm with different tempos"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-600">
        <p>Built with ❤️ for absolute beginners learning guitar</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-lg transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function UpcomingFeature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
