"use client";

import Navigation from "@/components/Navigation";
import FeatureCard from "@/components/FeatureCard";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <Container variant="page">
      {/* Navigation */}
      <Navigation subtitle="Master chord changes with AI-guided drills" />

      {/* Hero Section */}
      <Container className="py-24">
        <div className="space-y-12">
          <div className="space-y-6 text-center">
            <Badge animated icon={<span className="w-2 h-2 rounded-full bg-blue-600" />}>
              Introducing Chord Master
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900">
              Master Chord Changes
              <span className="block bg-linear-to-r from-blue-600 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                in Just 60 Seconds
              </span>
            </h1>
            
            <p className="mx-auto max-w-3xl text-xl text-slate-600 leading-relaxed">
              Scientific practice drills designed to build muscle memory faster. Practice smooth chord transitions with our intelligent timing system. Perfect for absolute beginners.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="/chords"
              variant="primary"
              size="lg"
              icon={
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
              }
            >
              Start Practicing
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon="🎸"
            title="Smart Practice Drills"
            description="AI-timed chord transitions that adapt to your speed. Master 16 essential beginner chords with focused repetition."
          />
          <FeatureCard
            icon="⚡"
            title="Progressive Training"
            description="Start with 2 chords and build up to 8. Smooth transitions matter more than speed at first."
          />
          <FeatureCard
            icon="📱"
            title="Works Everywhere"
            description="Install as a web app on any device. Practice offline anytime, anywhere without friction."
          />
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-3 gap-6 rounded-2xl bg-white border border-slate-200/50 p-8 shadow-sm">
          <StatCard value="16" label="Beginner Chords" />
          <StatCard value="1m" label="Timed Drills" />
          <StatCard value="∞" label="Free Practice" />
        </div>

        {/* Upcoming Features Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Coming Soon</h2>
            <p className="text-slate-600 mt-2">More features to accelerate your guitar journey</p>
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
