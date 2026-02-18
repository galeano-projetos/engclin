"use client";

import { Navbar } from "./sections/navbar";
import { Hero } from "./sections/hero";
import { ProblemSolution } from "./sections/problem-solution";
import { Features } from "./sections/features";
import { Pricing } from "./sections/pricing";
import { SocialProof } from "./sections/social-proof";
import { FinalCta } from "./sections/final-cta";
import { Footer } from "./sections/footer";

export function LandingPage() {
  return (
    <div className="bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <Pricing />
      <SocialProof />
      <FinalCta />
      <Footer />
    </div>
  );
}
