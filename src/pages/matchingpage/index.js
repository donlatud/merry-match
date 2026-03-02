"use client";
// src/pages/matchingpage/index.js
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import CardStack from "@/components/matching/CardStack";
import FilterSheet from "@/components/matching/FilterSheet";
import FilterPanel from "@/components/matching/FilterPanel";
import LeftSidebar from "@/components/matching/LeftSidebar";
import DesktopCardView from "@/components/matching/DesktopCardView";
import MerryMatchModal from "@/components/matching/MerryMatchModal";
import NavBar from "@/components/NavBar";

// ── animation variants ────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const slideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const slideRight = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function MatchingPage() {
  const [profiles, setProfiles] = useState([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const [merryLimit, setMerryLimit] = useState(20);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);

  // ── helper ดึง token จาก localStorage ────────────────────────
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  // ── Fetch Profiles ────────────────────────────────────────────
  const fetchProfiles = useCallback(async (filters = {}) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const params = { ...filters };

      if (Array.isArray(params.genders)) {
        params.genders = params.genders.join(",");
      }
      if (params.ageRange) {
        params.ageMin = params.ageRange[0];
        params.ageMax = params.ageRange[1];
        delete params.ageRange;
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`/api/matching/profiles?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.profiles) {
        setProfiles(result.profiles);
        setMerryLimit(result.swipeLimit ?? 20);
        setRemainingCount(result.swipeRemaining ?? 20);
        setMyProfileId(result.myProfileId);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ── Fetch Matches ─────────────────────────────────────────────
  const fetchMatches = useCallback(async () => {
    if (!myProfileId) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `/api/matching/matches?profileId=${myProfileId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await res.json();
      if (result.success) setMatches(result.data);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setMatchesLoading(false);
    }
  }, [myProfileId]);

  useEffect(() => {
    if (myProfileId) fetchMatches();
  }, [myProfileId, fetchMatches]);

  // ── Handle Swipe ──────────────────────────────────────────────
  const handleSwipe = async (direction, profileId) => {
    const token = getToken();
    if (!token) return;

    const status = direction === "right" ? "LIKE" : "DISLIKE";
    const swipedProfile = profiles.find((p) => p.id === profileId);

    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (status === "LIKE") {
      setRemainingCount((prev) => Math.max(prev - 1, 0));
    }

    try {
      const res = await fetch("/api/matching/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId: profileId, status }),
      });

      const data = await res.json();

      if (data.isMatch) {
        setTimeout(() => {
          setMatchedProfile(swipedProfile ?? null);
          setMatchModalOpen(true);
        }, 800);
        fetchMatches();
      }
    } catch (error) {
      console.error("Swipe API error:", error);
    }
  };

  const handleSearch = (filters) => fetchProfiles(filters);

  const merryLimitDisplay =
    merryLimit === "Unlimited"
      ? "Unlimited"
      : `${remainingCount}/${merryLimit}`;

  return (
    <div className="font-sans h-screen flex flex-col overflow-hidden bg-utility-bg">
      <header className="relative z-1000 shrink-0">
        <NavBar />
      </header>

      <MerryMatchModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        matchedProfile={matchedProfile}
      />

      {/* ── MOBILE layout ── */}
      <motion.div
        className="flex flex-col flex-1 overflow-hidden lg:hidden"
        variants={slideUp}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full flex-1 overflow-visible">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
              <p className="text-body4 text-gray-500">Finding new people...</p>
            </div>
          ) : (
            <CardStack
              profiles={profiles}
              onSwipe={handleSwipe}
              merryDisabled={remainingCount <= 0}
            />
          )}
        </div>

        <div className="mt-auto flex items-center justify-between px-6 py-5 bg-utility-bg shrink-0">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 text-gray-700 hover:text-red-400 transition-colors cursor-pointer"
          >
            <img src="/merry_icon/icon-filter.svg" alt="" className="w-5 h-5" />
            <span className="text-body4 font-semibold">Filter</span>
          </button>
          <div className="flex items-center gap-1 text-body4 font-semibold">
            <span className="text-gray-500">Merry limit today</span>
            <span className="text-red-400 font-bold ml-1">
              {merryLimitDisplay}
            </span>
          </div>
        </div>

        <FilterSheet
          open={filterOpen}
          onOpenChange={setFilterOpen}
          onSearch={handleSearch}
        />
      </motion.div>

      {/* ── DESKTOP layout ── */}
      <motion.div
        className="hidden lg:flex flex-1 overflow-hidden"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-1 overflow-hidden mx-auto w-full">
          {/* Left Sidebar — slide in จากซ้าย */}
          <motion.aside
            variants={slideLeft}
            className="w-72 shrink-0 overflow-hidden px-6 py-8 border-r bg-utility-bg-main"
          >
            <LeftSidebar
              currentProfileId={myProfileId}
              matches={matches}
              loading={matchesLoading}
            />
          </motion.aside>

          {/* Center — fade + slide up */}
          <motion.main
            variants={slideUp}
            className="flex-1 flex flex-col items-center overflow-visible px-6 py-8"
          >
            <div className="w-full flex-1 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
                  <p className="text-body4 text-white/60">Finding matches...</p>
                </div>
              ) : (
                <DesktopCardView
                  profiles={profiles}
                  onSwipe={handleSwipe}
                  merryDisabled={remainingCount <= 0}
                />
              )}
            </div>
            <div className="mt-auto pt-4 pb-2 flex items-center gap-1 text-body4 font-semibold shrink-0">
              <span className="text-white/60">Merry limit today</span>
              <span className="text-red-400 font-bold ml-1">
                {merryLimitDisplay}
              </span>
            </div>
          </motion.main>

          {/* Right Filter — slide in จากขวา */}
          <motion.aside
            variants={slideRight}
            className="w-72 shrink-0 overflow-y-auto px-6 py-8 border-l bg-utility-bg-main"
          >
            <FilterPanel onSearch={handleSearch} />
          </motion.aside>
        </div>
      </motion.div>
    </div>
  );
}
