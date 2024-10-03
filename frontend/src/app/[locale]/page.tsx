import DepositSection from "@/components/landing/DepositSection";
import EarnSection from "@/components/landing/EarnSection";
import Hero from "@/components/landing/Hero";
import WithdrawSection from "@/components/landing/WithdrawSection";
import FeatureSection from "@/components/landing/FeatureSection";
import Navbar from "@/components/Navbar";
import Roadmap from "@/components/landing/Roadmap";
import Footer from "@/components/Footer";
export default function Home() {
  return (
    <main className="min-h-screen min-w-screen bg-white text-black">
      <Navbar />
      <Hero />
      <DepositSection />
      <WithdrawSection />
      <EarnSection />
      <FeatureSection />
      <Roadmap />
      <Footer />
    </main>
  );
}
