"use client";

import Navigation from "@/components/Navigation";
import FeatureCard from "@/components/FeatureCard";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import Footer from "@/components/Footer";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <Container variant="page">
      {/* Navigation */}
      <Navigation subtitle="Your guided path to playing guitar" />

      {/* Hero Section */}
      <Container className="py-24">
        <div className="space-y-12">
          <div className="space-y-6 text-center">
            <Badge animated icon={<span className="w-2 h-2 rounded-full bg-blue-600" />}>
              Free Guitar Practice Tools
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900">
              Learn Guitar
              <span className="block bg-linear-to-r from-blue-600 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                One Exercise at a Time
              </span>
            </h1>
            
            <p className="mx-auto max-w-3xl text-xl text-slate-600 leading-relaxed">
              Practice drills designed to build muscle memory faster. Master chord transitions, strumming patterns, and more with our intelligent practice system. Perfect for absolute beginners.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="#exercises"
              variant="primary"
              size="lg"
              icon={
                <ArrowRightIcon className="h-5 w-5" />
              }
            >
              Start Practicing
            </Button>
            <Button variant="secondary" size="lg" href="#coming-soon">
              What&apos;s Coming
            </Button>
          </div>
        </div>

        {/* Exercises Section */}
        <div className="mt-24" id="exercises">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Practice Exercises</h2>
            <p className="text-slate-600 mt-2">Pick an exercise and start building your skills</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Chord Changes Exercise */}
            <div className="group relative rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur p-8 hover:border-blue-300 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">🎸</div>
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                  Available
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Chord Changes</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Select 2–8 chords and practice smooth transitions in a timed 60-second drill. Build muscle memory for switching between chords quickly.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">16 Chords</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">60s Drills</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Visual Diagrams</span>
              </div>
              <Button href="/chords" variant="primary" size="md">
                Practice Chords
              </Button>
            </div>

            {/* Strumming Patterns Exercise */}
            <div className="group relative rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur p-8 hover:border-blue-300 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">🎵</div>
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                  Available
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Strumming Patterns</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Learn common strumming patterns with timed drills. Pick from a library of patterns or build your own custom pattern.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">12 Patterns</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Custom Builder</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Adjustable Timer</span>
              </div>
              <Button href="/strumming" variant="primary" size="md">
                Practice Strumming
              </Button>
            </div>
          </div>
        </div>

        {/* Why It Works Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Why It Works</h2>
            <p className="text-slate-600 mt-2">Built around proven practice techniques</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon="🧠"
              title="Focused Repetition"
              description="Short timed drills force focused practice. Repetition is the key to building muscle memory for any instrument."
            />
            <FeatureCard
              icon="⚡"
              title="Progressive Training"
              description="Start simple and build up. Each exercise lets you choose your difficulty level and work at your own pace."
            />
            <FeatureCard
              icon="📱"
              title="Works Everywhere"
              description="Install as a web app on any device. Practice offline anytime, anywhere without friction."
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 rounded-2xl bg-white border border-slate-200/50 p-8 shadow-sm">
          <StatCard value="16" label="Chords" />
          <StatCard value="12" label="Strum Patterns" />
          <StatCard value="2" label="Exercises" />
          <StatCard value="∞" label="Free Practice" />
        </div>

        {/* Upcoming Features Section */}
        <div className="mt-24" id="coming-soon">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Coming Soon</h2>
            <p className="text-slate-600 mt-2">More exercises to accelerate your guitar journey</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="🎵"
              title="Session Builder"
              description="Create custom practice routines"
              size="md"
            />
            <FeatureCard
              icon="💪"
              title="Finger Gym"
              description="Build finger strength exercises"
              size="md"
            />
            <FeatureCard
              icon="🎶"
              title="Song Practice"
              description="Learn chords in real songs"
              size="md"
            />
            <FeatureCard
              icon="🥁"
              title="Tempo Sync"
              description="Practice with adjustable BPM"
              size="md"
            />
          </div>
        </div>
      </Container>

      {/* Footer */}
      <Footer />
    </Container>
  );
}
