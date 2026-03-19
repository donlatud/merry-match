import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { ButtonGoToChat, ButtonSeeProfile, ButtonMerry } from "@/components/commons/button/IconButton";
import { MerryProfileCard } from "@/components/merrylist/MerryProfileCard.jsx";
import { ProfilePopup } from "@/components/profilePopup/ProfilePopup.jsx";
import { Loading } from "@/components/commons/Loading/Loading";
import { AuthContext } from "@/contexts/login/AuthContext";
import { supabase } from "@/providers/supabase.provider";
import MerryMatchModal from "@/components/matching/MerryMatchModal";

function getAuthHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function formatNumber(n) {
  return String(n ?? 0).padStart(2, "0");
}

function getResetInText() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ms = midnight - now;
  if (ms <= 0) return "Reset in 0h 0m";
  const totalMinutes = Math.floor(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `Reset in ${h}h ${m}m`;
  return `Reset in ${m}m`;
}

export default function MerryToYouPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [merryMatch, setMerryMatch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [merryLimit, setMerryLimit] = useState({ used: 0, total: 20, resetAt: "00:00" });
  const [resetInText, setResetInText] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [openingChatProfileId, setOpeningChatProfileId] = useState(null);

  const planMode = router.query.mode;
  const isFreeMode = planMode === "free";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!router.isReady) return;
    if (isFreeMode) {
      setShowUpsellModal(true);
    } else {
      setShowUpsellModal(false);
    }
  }, [router.isReady, isFreeMode]);

  useEffect(() => {
    const update = () => setResetInText(getResetInText());
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }

    const fetchMerryToYouList = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;
        const res = await axios.get("/api/merrylist", {
          headers: getAuthHeaders(token),
        });
        // ใช้ list ที่เป็น "คนที่กด like เรา" จาก API
        setProfiles(res.data?.merryToYouList ?? []);
        setMerryLimit(res.data?.merryLimit ?? { used: 0, total: 20, resetAt: "00:00" });
        setMerryMatch(res.data?.merryMatch ?? 0);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "โหลดรายการ Merry to you ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchMerryToYouList();
  }, [isAuthenticated, authLoading]);

  const handleMerryFromList = async (profileId) => {
    if (!isAuthenticated || authLoading) return;

    try {
      setError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;

      const res = await axios.post(
        "/api/matching/swipe",
        { receiverId: profileId, status: "LIKE" },
        { headers: getAuthHeaders(token) }
      );

      const data = res.data;

      if (data?.isMatch) {
        const swipedProfile = profiles.find((p) => p.id === profileId) ?? null;
        const modalProfile = swipedProfile
          ? {
            ...swipedProfile,
            image: swipedProfile.image ?? swipedProfile.images?.[0] ?? null,
          }
          : null;

        setMatchedProfile(modalProfile);
        setMatchModalOpen(true);
      }

      // อัปเดต UI แบบ optimistic: เอาคนที่เรา merry ออก และอัปเดต limit
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      setMerryLimit((prev) => ({
        ...prev,
        used: Math.min((prev?.used ?? 0) + 1, prev?.total ?? (prev?.used ?? 0) + 1),
      }));
    } catch (err) {
      setError(err.response?.data?.error || err.message || "กด Merry ไม่สำเร็จ");
    }
  };

  const handleGoToChat = async (partnerProfileId) => {
    if (!partnerProfileId) return;
    setOpeningChatProfileId(partnerProfileId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partnerId: partnerProfileId }),
      });
      const result = await res.json();
      if (result.success && result.data?.id) {
        router.push(`/chat/${result.data.id}`);
      }
    } catch (err) {
      console.error("Failed to open chat room from merry-to-you:", err);
    } finally {
      setOpeningChatProfileId(null);
    }
  };

  const handleMerryFromPopup = async () => {
    if (!selectedProfileId) return;
    await handleMerryFromList(selectedProfileId);
    setSelectedProfileId(null);
  };

  const isBlurred = isFreeMode && showUpsellModal;

  return (
    <div>
      <NavBar />

      <MerryMatchModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        matchedProfile={matchedProfile}
      />

      <div className={isBlurred ? "pointer-events-none select-none filter blur-sm" : ""}>
        <div className="flex justify-center">
          <div className="flex justify-center flex-col lg:w-[933px]">
            <div className="py-10 px-4 gap-8 flex flex-col">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2">
                  {/* <button
                  type="button"
                  onClick={() => router.push("/merry-list")}
                  className="hidden lg:inline-flex items-center gap-2 self-auto py-2  text-body3 text-gray-700 cursor-pointer"
                >
                  <span className="text-lg leading-none">←</span>
                  <span>Back</span>
                </button> */}
                  {/* Mobile-friendly back button: อยู่ใต้คำอธิบาย ชิดซ้าย เต็มความกว้างพอให้กดง่าย */}
                  {/* <button
                    type="button"
                    onClick={() => router.push("/merry-list")}
                    className="mt-3 inline-flex items-center gap-2 w-full sm:w-auto py-2 rounded-full text-gray-700 hover:bg-gray-50 cursor-pointer lg:hidden"
                  >
                    <span className="text-lg leading-none">←</span>
                    <span>Back </span>
                  </button> */}
                  <span className="text-body2 text-beige-700 lg:text-beige-600 font-semibold">
                    MERRY TO YOU
                  </span>
                  <h1 className="text-headline3 lg:text-headline2 text-purple-500 font-bold">
                    People who merry you
                  </h1>
                  <p className="text-body2 text-gray-700 max-w-xl">
                    See who has already merry’d you and decide who you want to match with.
                  </p>


                </div>

                {/* Desktop: ปุ่มกลับอยู่มุมขวาแบบเดิม */}
                {/* <button
                  type="button"
                  onClick={() => router.push("/merry-list")}
                  className="hidden lg:inline-flex items-center gap-2 self-auto px-4 py-2  text-body3 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <span className="text-lg leading-none">←</span>
                  <span>Back</span>
                </button> */}
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="gap-4 w-full flex flex-row ">
                  {/* กล่อง Merry to you (เหมือนบนหน้า Merry Match) */}
                  <div className="border px-6 py-4 rounded-3xl flex bg-white w-full sm:w-1/2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 lg:pb-1">
                        <p className="text-headline4 text-red-500 font-bold">
                          {formatNumber(profiles.length)}
                        </p>
                        <img
                          src="/merry_icon/icon-merry-to-you.svg"
                          alt="Merry to you icon"
                          className="w-6 h-6"
                        />
                      </div>
                      <p className="text-body2 text-gray-700 font-medium">Merry to you</p>
                      <p className="text-body5 text-gray-400 -mt-1">
                      You&apos;re on this list now
                    </p>
                    </div>
                  </div>

                  {/* กล่อง Merry match – กดแล้วไปหน้า merry-list */}
                  <button
                    type="button"
                    onClick={() => router.push("/merry-list")}
                    className="group border px-6 py-4 rounded-3xl flex bg-white w-full sm:w-1/2 cursor-pointer hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md transition transform focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2"
                    aria-label="Go to Merry Match list"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <p className="text-headline4 text-red-500 font-bold group-hover:text-red-600">
                          {formatNumber(merryMatch)}
                        </p>
                        <img
                          src="/merry_icon/icon-merry-match.svg"
                          alt="Merry match icon"
                          className="w-12 h-6"
                        />
                      </div>
                      <p className="text-body2 text-gray-700 font-medium text-start group-hover:text-red-500 group-hover:underline">
                        Merry match
                      </p>
                      <p className="text-body5 text-start text-gray-400 -mt-1">
                        Tap to see merry match
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col w-full lg:w-full items-end lg:items-end px-0">
                  <div className="flex gap-2.5">
                    <p className="text-body2 text-gray-700 font-medium">Merry limit today</p>
                    <p className="text-body2 text-red-400">
                      {merryLimit.used}/{merryLimit.total}
                    </p>
                  </div>
                  <p className="text-body5 text-gray-600">
                    {resetInText || getResetInText()}
                  </p>
                </div>
              </div>
            </div>

            {loading && (
              <div className="px-4">
                <Loading colorClass="text-purple-700" className="min-h-[200px]" />
              </div>
            )}
            {error && !loading && (
              <p className="px-4 text-body2 text-red-600">{error}</p>
            )}

            {!loading && !error && profiles.length === 0 && (
              <div className="px-4 py-12 flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-body1 text-gray-700 max-w-md">
                  No one has merry’d you yet. Try joining the matching to get noticed by more people!
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/matchingpage")}
                  className="cursor-pointer px-6 py-3 rounded-full bg-red-500 text-white font-semibold text-body2 hover:bg-red-600 transition-colors"
                >
                  Go to Matching
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              profiles.length > 0 &&
              profiles.map((profile) => (
                <div className="px-4" key={profile.id}>
                  <MerryProfileCard
                    profile={profile}
                    onViewProfile={() => setSelectedProfileId(profile.id)}
                  >
                    <div className="flex gap-3">
                      {profile.status === 1 && (
                        <ButtonGoToChat
                          iconClassName={`brightness-0 saturate-0 ${openingChatProfileId === profile.id ? "opacity-30" : "opacity-60"
                            }`}
                          disabled={openingChatProfileId !== null}
                          onClick={() => handleGoToChat(profile.id)}
                        />
                      )}
                      <ButtonSeeProfile
                        iconClassName="brightness-0 saturate-0 opacity-60"
                        onClick={() => setSelectedProfileId(profile.id)}
                      />
                      <ButtonMerry onClick={() => handleMerryFromList(profile.id)} />
                    </div>
                  </MerryProfileCard>
                </div>
              ))}
          </div>
        </div>
      </div>

      {isFreeMode && showUpsellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-[32px] w-full max-w-lg mx-4 shadow-2xl p-6 lg:p-8 relative">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              onClick={() => setShowUpsellModal(false)}
              aria-label="Close"
            >
              <img src="/merry_icon/icon-close.svg" alt="" className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/merry_icon/icon-merry-package.svg"
                  alt=""
                  className="w-10 h-10"
                />
                <div>
                  <h2 className="text-headline4 font-bold text-purple-500">
                    See who merry you in full
                  </h2>
                  <p className="text-body3 text-gray-600">
                    Right now you are in Free preview mode. Upgrade to see all profiles clearly and
                    match without limits.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                <div className="border rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-body4 font-semibold text-gray-500 uppercase tracking-wide">
                    Free preview
                  </p>
                  <p className="text-headline4 font-bold text-gray-900">Limited view</p>
                  <ul className="text-body3 text-gray-600 list-disc list-inside space-y-1">
                    <li>See blurred list of people who merry you</li>
                    <li>Sample profiles per day</li>
                    <li>Basic matching</li>
                  </ul>
                </div>

                <div className="border-2 border-red-400 rounded-2xl p-4 bg-red-50 flex flex-col gap-2">
                  <p className="text-body4 font-semibold text-red-500 uppercase tracking-wide">
                    Recommended
                  </p>
                  <p className="text-headline4 font-bold text-gray-900">Merry Membership</p>
                  <ul className="text-body3 text-gray-700 list-disc list-inside space-y-1">
                    <li>See every profile clearly</li>
                    <li>Unlimited merry &amp; match</li>
                    <li>Read full details and photos</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-full bg-red-500 text-white text-body2 font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                  onClick={() => router.push("/membership")}
                >
                  View Merry Membership packages
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 rounded-full text-body3 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowUpsellModal(false);
                    router.push("/merry-list");
                  }}
                >
                  Back to merrylist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfilePopup
        open={Boolean(selectedProfileId)}
        onClose={() => setSelectedProfileId(null)}
        id={selectedProfileId}
        leftButton={<></>}
        rightButton={
          <ButtonMerry
            onClick={handleMerryFromPopup}
            className="w-15 h-15 [&_img]:w-12 [&_img]:h-10 shadow-button"
          />
        }
      />

      <Footer />
    </div>
  );
}

