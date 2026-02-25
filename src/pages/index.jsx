import { useScrollToHash } from "@/hooks/useScrollToHash";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/landing/HeroSection";
import WhyMerryMatchSection from "@/components/landing/WhyMerryMatchSection";
import HowToMerrySection from "@/components/landing/HowToMerrySection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/Footer";

export default function LandingPage() {
  // มาจากหน้าอื่นด้วย hash (/#why-merry-match หรือ /#how-to-merry) เลื่อนไป section
  useScrollToHash();

  return (
    <>
      <NavBar />
      <HeroSection />
      <WhyMerryMatchSection />
      <HowToMerrySection />
      <CtaSection />
      <Footer />
    </>
  );
}
