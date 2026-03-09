"use client";

import { useState, useCallback, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/login/AuthContext";
import { supabase } from "@/providers/supabase.provider";

import CardStack from "@/components/matching/CardStack";
import FilterSheet from "@/components/matching/FilterSheet";
import FilterPanel from "@/components/matching/FilterPanel";
import LeftSidebar from "@/components/matching/LeftSidebar";
import DesktopCardView from "@/components/matching/DesktopCardView";
import MerryMatchModal from "@/components/matching/MerryMatchModal";
import NavBar from "@/components/NavBar";

// ── Animation Variants ────────────────────────────────────────
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
  // ── Context & Router ──
  const { user, loading: authLoading } = useContext(AuthContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── States ──
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

  // ตรวจสอบสถานะการเปิด Chat บน Mobile จาก URL
  const isMobileChatOpen = searchParams.get("showChat") === "true";

  // ── Fetch Profiles ────────────────────────────────────────────
  const fetchProfiles = useCallback(async (filters = {}) => {
    if (authLoading || !user) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
console.log(token);

      const params = { ...filters };
      if (Array.isArray(params.genders)) params.genders = params.genders.join(",");
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
  }, [authLoading, user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ── Fetch Matches ─────────────────────────────────────────────
  const fetchMatches = useCallback(async () => {
    if (!myProfileId || !user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/matching/matches?profileId=${myProfileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setMatches(result.data);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setMatchesLoading(false);
    }
  }, [myProfileId, user]);

  useEffect(() => {
    if (myProfileId) fetchMatches();
  }, [myProfileId, fetchMatches]);

  // ── Actions ──────────────────────────────────────────────────
  const handleSwipe = async (direction, profileId) => {
    if (!user) return;

    const status = direction === "right" ? "LIKE" : "DISLIKE";
    const swipedProfile = profiles.find((p) => p.id === profileId);

    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (status === "LIKE") setRemainingCount((prev) => Math.max(prev - 1, 0));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

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
      console.error("Swipe error:", error);
    }
  };

  const closeMobileChat = () => {
    router.push("/matchingpage", { scroll: false });
  };

  // ── Render Logic ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-utility-bg">
        <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const merryLimitDisplay = merryLimit === "Unlimited" ? "Unlimited" : `${remainingCount}/${merryLimit}`;

  return (
    <div className="font-sans h-screen flex flex-col overflow-hidden bg-utility-bg relative">
      <header className="relative z-100 shrink-0">
        <NavBar />
      </header>

      <MerryMatchModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        matchedProfile={matchedProfile}
      />

      {/* ── MOBILE CHAT OVERLAY ── */}
      <AnimatePresence>
        {isMobileChatOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-150 bg-white lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-body2 font-bold text-gray-900">Matches & Chats</h2>
              <button onClick={closeMobileChat} className="p-2 hover:bg-gray-100 rounded-full">
                <img src="/merry_icon/icon-close.svg" alt="Close" className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <LeftSidebar currentProfileId={myProfileId} matches={matches} loading={matchesLoading} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MOBILE MAIN VIEW ── */}
      <motion.div
        className={`flex flex-col flex-1 overflow-hidden lg:hidden ${isMobileChatOpen ? "hidden" : "flex"}`}
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
            <CardStack profiles={profiles} onSwipe={handleSwipe} merryDisabled={remainingCount <= 0} />
          )}
        </div>

        <div className="mt-auto flex items-center justify-between px-6 py-5 bg-utility-bg shrink-0">
          <button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 text-gray-700 hover:text-red-400">
            <img src="/merry_icon/icon-filter.svg" alt="" className="w-5 h-5" />
            <span className="text-body4 font-semibold">Filter</span>
          </button>
          <div className="flex items-center gap-1 text-body4 font-semibold text-gray-500">
            Merry limit today <span className="text-red-400 font-bold ml-1">{merryLimitDisplay}</span>
          </div>
        </div>
        <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} onSearch={(f) => fetchProfiles(f)} />
      </motion.div>

      {/* ── DESKTOP LAYOUT ── */}
      <motion.div className="hidden lg:flex flex-1 overflow-hidden" variants={pageVariants} initial="hidden" animate="visible">
        <div className="flex flex-1 overflow-hidden mx-auto w-full">
          {/* Left Sidebar */}
          <motion.aside variants={slideLeft} className="w-80 shrink-0 overflow-hidden px-6 py-8 border-r bg-utility-bg-main">
            <LeftSidebar currentProfileId={myProfileId} matches={matches} loading={matchesLoading} />
          </motion.aside>

          {/* Center Content */}
          <motion.main variants={slideUp} className="flex-1 flex flex-col items-center overflow-visible px-6 py-8">
            <div className="w-full flex-1 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
                  <p className="text-body4 text-white/60">Finding matches...</p>
                </div>
              ) : (
                <DesktopCardView profiles={profiles} onSwipe={handleSwipe} merryDisabled={remainingCount <= 0} />
              )}
            </div>
            <div className="mt-auto pt-4 pb-2 flex items-center gap-1 text-body4 font-semibold">
              <span className="text-white/60">Merry limit today</span>
              <span className="text-red-400 font-bold ml-1">{merryLimitDisplay}</span>
            </div>
          </motion.main>

          {/* Right Filter */}
          <motion.aside variants={slideRight} className="w-80 shrink-0 overflow-y-auto px-6 py-8 border-l bg-utility-bg-main">
            <FilterPanel onSearch={(f) => fetchProfiles(f)} />
          </motion.aside>
        </div>
      </motion.div>
    </div>
  );
}