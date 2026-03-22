"use client";

import React from "react";

/**
 * Pagination สำหรับรูปโปรไฟล์
 * - แสดงเลขตำแหน่งปัจจุบัน/ทั้งหมด (เช่น 1/2)
 * - ปุ่มลูกศรซ้าย/ขวา กดเพื่อเปลี่ยนรูป
 *
 * Props:
 * - total: จำนวนรูป (จาก user.images.length)
 * - currentIndex: index ปัจจุบัน (0-based)
 * - onPrev: () => void
 * - onNext: () => void
 */
export function PaginationWrapper({
  total,
  currentIndex,
  onPrev,
  onNext,
  prevIcon,
  nextIcon,
}) {
  const count = Math.max(1, total);
  const displayCurrent = total ? (currentIndex % total) + 1 : 1;
  const canGoPrev = total > 1;
  const canGoNext = total > 1;

  return (
    <div className="flex h-12 w-full items-center justify-between px-4">
      <div className="flex items-baseline gap-0.5">
        <span className="text-body2 font-semibold text-gray-700">{displayCurrent}</span>
        <span className="text-body2 text-gray-600">/</span>
        <span className="text-body2 text-gray-600">{count}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="flex size-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-200/80 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="รูปก่อนหน้า"
        >
          {prevIcon ?? (
            <img
              src="/merry_icon/arrow.svg"
              alt=""
              width={24}
              height={24}
              className="rotate-180"
            />
          )}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="flex size-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-200/80 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="รูปถัดไป"
        >
          {nextIcon ?? (
            <img src="/merry_icon/arrow.svg" alt="" width={24} height={24} />
          )}
        </button>
      </div>
    </div>
  );
}
