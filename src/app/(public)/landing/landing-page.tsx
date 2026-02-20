"use client";

import { Navbar } from "./sections/navbar";
import { Hero } from "./sections/hero";
import { ProblemSolution } from "./sections/problem-solution";
import { Features } from "./sections/features";
import { Pricing } from "./sections/pricing";
import { Roi } from "./sections/roi";
import { SocialProof } from "./sections/social-proof";
import { PlatformStats } from "./sections/platform-stats";
import { FinalCta } from "./sections/final-cta";
import { Footer } from "./sections/footer";

export function LandingPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <Pricing />
      <Roi />
      <SocialProof />
      <PlatformStats />
      <FinalCta />
      <Footer />
    </div>
  );
}
