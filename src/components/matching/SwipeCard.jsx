"use client";
// components/matching/SwipeCard.jsx
import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import ProfileCard from "./ProfileCard";
import { ButtonMerry, ButtonPass } from "../commons/button/IconButton";

const SWIPE_THRESHOLD = 120;

export default function SwipeCard({
  profile,
  isTop,
  offset,
  onSwipe,
  merryDisabled,
}) {
  const x = useMotionValue(0);
  
  // สร้างการเอียงและการเปลี่ยนสี (Overlay) ระหว่างปัด
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

  // คำนวณ Scale และตำแหน่งสำหรับการซ้อนการ์ด (Stacking)
  const scale = isTop ? 1 : Math.max(1 - offset * 0.05, 0.85);
  const translateY = isTop ? 0 : offset * -15;

  const triggerSwipe = (direction) => {
    const target = direction === "right" ? 800 : -800;
    
    // อนิเมชั่นการดีดการ์ดออก
    animate(x, target, {
      type: "spring",
      stiffness: 250,
      damping: 30,
      onComplete: () => onSwipe(direction, profile.id),
    });
  };

  const handleDragEnd = (_, info) => {
    const velocity = info.velocity.x;
    const offsetPos = info.offset.x;

    if (offsetPos > SWIPE_THRESHOLD || velocity > 500) {
      triggerSwipe("right");
    } else if (offsetPos < -SWIPE_THRESHOLD || velocity < -500) {
      triggerSwipe("left");
    } else {
      // ดึงการ์ดกลับมาตรงกลาง
      animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 50 - offset,
        transformOrigin: "bottom center",
      }}
      animate={{
        scale,
        y: translateY,
        opacity: offset > 3 ? 0 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 200, // ลด stiffness เพื่อให้การเลื่อนขึ้นดูหน่วงและนุ่ม
        damping: 25,
        // ✨ จังหวะหน่วง: ใบถัดไปจะรอ 0.15 วินาทีหลังจากใบแรกถูกปัดออกไป
        delay: isTop ? 0 : 0.15, 
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
    >
      {/* Container สำหรับ ProfileCard */}
     <div className="w-full h-full rounded-b-[32px] overflow-hidden shadow-2xl">
        <ProfileCard profile={profile} />
      </div>

      {/* ปุ่มกดแสดงเฉพาะใบหน้าสุด */}
      {isTop && (
        <motion.div
          className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-6"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }} // ให้ปุ่มโผล่ตามมาทีหลังเล็กน้อย
          style={{ zIndex: 100 }}
        >
          <ButtonPass 
            onClick={() => triggerSwipe("left")} 
            className="w-20 h-20 [&_img]:w-10 [&_img]:h-10 transition-all duration-300" 
          />
          <ButtonMerry 
            onClick={() => triggerSwipe("right")} 
            disabled={merryDisabled} 
             className="w-20 h-20 [&_img]:w-10 [&_img]:h-10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
          />
        </motion.div>
      )}
    </motion.div>
  );
}