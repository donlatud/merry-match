"use client";
// components/matching/SwipeCard.jsx
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import ProfileCard from "./ProfileCard";
import { ButtonMerry, ButtonPass } from "../commons/button/IconButton";

const SWIPE_THRESHOLD = 120;

export default function SwipeCard({ profile, isTop, offset, onSwipe, merryDisabled, onViewProfile }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  const scale = isTop ? 1 : Math.max(1 - offset * 0.05, 0.85);
  const translateY = isTop ? 0 : offset * -15;

  const triggerSwipe = (direction) => {
    const target = direction === "right" ? 800 : -800;
    animate(x, target, {
      type: "spring", stiffness: 250, damping: 30,
      onComplete: () => onSwipe(direction, profile.id),
    });
  };

  const handleDragEnd = (_, info) => {
    const { offset: off, velocity } = info;
    if (off.x > SWIPE_THRESHOLD || velocity.x > 500) triggerSwipe("right");
    else if (off.x < -SWIPE_THRESHOLD || velocity.x < -500) triggerSwipe("left");
    else animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
  };

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{ x: isTop ? x : 0, rotate: isTop ? rotate : 0, zIndex: 50 - offset, transformOrigin: "bottom center" }}
      animate={{ scale, y: translateY, opacity: offset > 3 ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay: isTop ? 0 : 0.15 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
    >
      <div className="w-full h-full rounded-b-[32px] overflow-hidden shadow-2xl">
        <ProfileCard profile={profile} onViewProfile={onViewProfile} />
      </div>

      {isTop && (
        <motion.div
          className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-6"
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }} style={{ zIndex: 100 }}
        >
          <ButtonPass onClick={() => triggerSwipe("left")} className="w-20 h-20 [&_img]:w-10 [&_img]:h-10 transition-all duration-300" />
          <ButtonMerry onClick={() => triggerSwipe("right")} disabled={merryDisabled} className="w-20 h-20 [&_img]:w-10 [&_img]:h-10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300" />
        </motion.div>
      )}
    </motion.div>
  );
}