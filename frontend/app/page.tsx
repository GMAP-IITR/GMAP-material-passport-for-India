import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import Solution from "@/components/sections/Solution";
import HowItWorks from "@/components/sections/HowItWorks";
import Roadmap from "@/components/sections/Roadmap";
import OpenSource from "@/components/sections/OpenSource";
import Contributors from "@/components/sections/Contributors";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Roadmap />
        {/* <OpenSource /> */}
        {/* <Contributors /> */}
      </main>
      <Footer />
    </>
  );
}
