"use client";
// components/matching/DesktopCardView.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProfileCard from "./ProfileCard";
import { ButtonMerry, ButtonPass } from "../commons/button/IconButton";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-32 h-32 rounded-full bg-red-100/20 flex items-center justify-center mb-2">
        <img src="/merry_icon/icon-favorite-outline.svg" alt="" className="w-16 h-16 opacity-60" />
      </div>
      <h3 className="text-headline4 font-bold text-white">No more profiles</h3>
      <p className="text-body4 text-white/60 leading-relaxed">
        You've seen everyone for now.<br />Check back later for new matches!
      </p>
    </div>
  );
}

function LimitReachedState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-32 h-32 rounded-full bg-red-100/20 flex items-center justify-center mb-2">
        <img src="/merry_icon/icon-heart.svg" alt="" className="w-16 h-16 opacity-60" />
      </div>
      <h3 className="text-headline4 font-bold text-white">Merry limit reached!</h3>
      <p className="text-body4 text-white/60 leading-relaxed">
        You've used all your Merry today.<br />Come back tomorrow for more matches!
      </p>
      <div className="mt-2 px-5 py-2 rounded-full bg-red-400/20 border border-red-400/30">
        <span className="text-body5 font-bold text-red-400">Resets every day at midnight 🌙</span>
      </div>
    </div>
  );
}

function getResponsiveConfig(screenWidth) {
  if (screenWidth >= 1440) return { cardWidth: 380, cardHeight: 560, translateX: 200, translateZ: 160 };
  return { cardWidth: 300, cardHeight: 460, translateX: 160, translateZ: 130 };
}

function getCardStyle(offset) {
  const absOffset = Math.abs(offset);
  if (absOffset > 2) return { display: "none" };
  return {
    rotateY: offset * -25,
    scale: 1 - absOffset * 0.15,
    opacity: 1 - absOffset * 0.4,
    zIndex: 10 - absOffset,
    filter: absOffset > 0 ? "brightness(0.6) blur(2px)" : "none",
  };
}

const ArrowIcon = ({ direction }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
);

export default function DesktopCardView({ profiles, onSwipe, merryDisabled, onViewProfile }) {
  const [centerIndex, setCenterIndex] = useState(0);
  const [config, setConfig] = useState(getResponsiveConfig(1440));

  useEffect(() => {
    const update = () => setConfig(getResponsiveConfig(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ✅ clamp centerIndex เมื่อ profiles ลดลง
  useEffect(() => {
    if (profiles.length === 0) {
      setCenterIndex(0);
      return;
    }
    setCenterIndex((prev) => Math.min(prev, profiles.length - 1));
  }, [profiles.length]);

  const currentProfile = profiles[centerIndex];

  const handlePrev = () => setCenterIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
  const handleNext = () => setCenterIndex((prev) => (prev + 1) % profiles.length);

  const handlePass = () => {
    if (!currentProfile) return;
    onSwipe("left", currentProfile.id);
    setCenterIndex((prev) => Math.max(0, prev - 1));
  };

  const handleMerry = () => {
    if (!currentProfile) return;
    onSwipe("right", currentProfile.id);
    setCenterIndex((prev) => Math.max(0, prev - 1));
  };

  if (merryDisabled) return <LimitReachedState />;
  if (profiles.length === 0) return <EmptyState />;

  const containerHeight = config.cardHeight + 80;

  return (
    <div className="relative w-full" style={{ height: `${containerHeight}px` }}>
      <button onClick={handlePrev} className="absolute left-2 top-[45%] -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors z-50 cursor-pointer">
        <ArrowIcon direction="left" />
      </button>
      <button onClick={handleNext} className="absolute right-2 top-[45%] -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors z-50 cursor-pointer">
        <ArrowIcon direction="right" />
      </button>

      <div className="absolute overflow-hidden" style={{ top: 0, bottom: 0, left: "48px", right: "48px" }}>
        <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1000px", perspectiveOrigin: "center center" }}>
          {profiles.map((profile, index) => {
            let offset = index - centerIndex;
            const half = Math.floor(profiles.length / 2);
            if (offset > half) offset -= profiles.length;
            if (offset < -half) offset += profiles.length;

            const style = getCardStyle(offset);
            if (style.display === "none") return null;

            const isCenter = offset === 0;
            const translateX = offset * config.translateX;
            const translateZ = -Math.abs(offset) * config.translateZ;

            return (
              <motion.div
                key={profile.id}
                className="absolute"
                style={{ width: `${config.cardWidth}px`, height: `${config.cardHeight}px`, transformStyle: "preserve-3d", cursor: isCenter ? "default" : "pointer" }}
                animate={{ x: translateX, z: translateZ, rotateY: style.rotateY, scale: style.scale, opacity: style.opacity, zIndex: style.zIndex, filter: style.filter }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => !isCenter && setCenterIndex(index)}
              >
                <div className="w-full h-full rounded-3xl overflow-hidden">
                  <ProfileCard
                    profile={profile}
                    onViewProfile={isCenter ? onViewProfile : undefined}
                  />
                </div>

                {isCenter && (
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 translate-y-1/2" style={{ zIndex: 999 }}>
                    <ButtonPass onClick={handlePass} className="w-20 h-20 [&_img]:w-10 [&_img]:h-10 transition-all duration-300" />
                    <ButtonMerry onClick={handleMerry} disabled={merryDisabled} className="w-20 h-20 [&_img]:w-10 [&_img]:h-10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}