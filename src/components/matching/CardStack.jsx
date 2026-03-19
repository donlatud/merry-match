"use client";
// components/matching/CardStack.jsx
import SwipeCard from "./SwipeCard";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center mb-2">
        <img src="/merry_icon/icon-favorite-outline.svg" alt="" className="w-16 h-16 opacity-60" />
      </div>
      <h3 className="text-headline4 font-bold text-gray-900">No more profiles</h3>
      <p className="text-body4 text-gray-500 leading-relaxed">
        You've seen everyone for now.<br />Check back later for new matches!
      </p>
    </div>
  );
}

function LimitReachedState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center mb-2">
        <img src="/merry_icon/icon-match-log.svg" alt="" className="w-16 h-16 opacity-60" />
      </div>
      <h3 className="text-headline4 font-bold text-gray-900">Merry limit reached!</h3>
      <p className="text-body4 text-gray-500 leading-relaxed">
        You've used all your Merry today.<br />Come back tomorrow for more matches!
      </p>
      <div className="mt-2 px-5 py-2 rounded-full bg-red-100 border border-red-200">
        <span className="text-body5 font-bold text-red-400">Resets every day at midnight 🌙</span>
      </div>
    </div>
  );
}

export default function CardStack({ profiles, onSwipe, merryDisabled, onViewProfile }) {
  if (merryDisabled) return <div className="relative w-full overflow-visible" style={{ height: "650px" }}><LimitReachedState /></div>;
  if (profiles.length === 0) return <div className="relative w-full overflow-visible" style={{ height: "650px" }}><EmptyState /></div>;

  return (
    <div className="relative w-full overflow-visible" style={{ height: "650px" }}>
      {profiles.map((profile, index) => {
        const isTop = index === profiles.length - 1;
        const offset = profiles.length - 1 - index;
        return (
          <SwipeCard
            key={profile.id}
            profile={profile}
            isTop={isTop}
            offset={offset}
            onSwipe={onSwipe}
            merryDisabled={merryDisabled}
            onViewProfile={onViewProfile}
          />
        );
      })}
    </div>
  );
}