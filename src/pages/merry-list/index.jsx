import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { AuthContext } from "@/contexts/login/AuthContext";
import { supabase } from "@/providers/supabase.provider";
import { ButtonSeeProfile } from "@/components/commons/button/IconButton";
import { ButtonGoToChat } from "@/components/commons/button/IconButton";
import { MerryProfileCard } from "@/components/merrylist/MerryProfileCard.jsx";
import { ProfilePopup } from "@/components/profilePopup/ProfilePopup.jsx";
import { Loading } from "@/components/commons/Loading/Loading";
import { MerryPackageCard } from "@/components/payment/MerryPackageCard.jsx";
import { usePackageSelection } from "@/hooks/payment/usePackageSelection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const PENDING_UNLIKES_STORAGE_KEY = "merrylist_pending_unlikes";

function readPendingUnlikesFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_UNLIKES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writePendingUnlikesToStorage(ids) {
  if (typeof window === "undefined") return;
  try {
    if (!ids || ids.length === 0) {
      window.localStorage.removeItem(PENDING_UNLIKES_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PENDING_UNLIKES_STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore storage errors
  }
}

export default function MerryListPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);

  const [profiles, setProfiles] = useState([]);
  const [statusFilter, setStatusFilter] = useState("latest"); // latest | match | notMatch
  const [merryToYou, setMerryToYou] = useState(0);
  const [merryMatch, setMerryMatch] = useState(0);
  const [merryLimit, setMerryLimit] = useState({ used: 0, total: 20, resetAt: "00:00" });
  const [resetInText, setResetInText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionPackageName, setSubscriptionPackageName] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [tempUnlikedIds, setTempUnlikedIds] = useState([]);
  const [openingChatProfileId, setOpeningChatProfileId] = useState(null);
  const hasFetchedMerryListRef = useRef(false);
  const isFetchingMerryListRef = useRef(false);

  // ใช้ข้อมูล package จริงจากระบบ เพื่อให้ Premium card ตรงกับหน้า membership
  const {
    packages: membershipPackages,
    onChoosePackage: onChooseMembershipPackage,
  } = usePackageSelection();
  const premiumPackage = membershipPackages.find(
    (pkg) => String(pkg?.name).toLowerCase() === "premium"
  );

  useEffect(() => {
    const update = () => setResetInText(getResetInText());
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  // sync initial pending unlikes from localStorage → state เมื่อเข้าเพจ
  useEffect(() => {
    const initial = readPendingUnlikesFromStorage();
    if (initial.length) {
      setTempUnlikedIds(initial);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }
    if (hasFetchedMerryListRef.current || isFetchingMerryListRef.current) return;

    const fetchMerryList = async () => {
      try {
        isFetchingMerryListRef.current = true;
        setLoading(true);
        setError(null);

        // [1] apply pending unlikes จาก localStorage ก่อนดึง Merry List
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;
        const headers = getAuthHeaders(token);

        const pendingIds = readPendingUnlikesFromStorage();
        if (pendingIds.length > 0) {
          try {
            await Promise.all(
              pendingIds.map((profileId) =>
                axios.delete("/api/matching/swipe", {
                  headers,
                  params: { receiverId: profileId },
                })
              )
            );
          } catch (err) {
            // ถ้า error บางตัว ก็ยังไปต่อได้และล้าง storage เพื่อไม่ให้ยิงซ้ำเรื่อย ๆ
            console.error("Failed to apply pending unlikes:", err);
          } finally {
            writePendingUnlikesToStorage([]);
            setTempUnlikedIds([]);
          }
        }

        // [2] ดึง Merry List หลังจาก apply unlikes แล้ว
        const res = await axios.get("/api/merrylist", {
          headers: getAuthHeaders(token),
        });
        setProfiles(res.data?.list ?? []);
        setMerryToYou(res.data?.merryToYou ?? 0);
        setMerryMatch(res.data?.merryMatch ?? 0);
        setMerryLimit(res.data?.merryLimit ?? { used: 0, total: 20, resetAt: "00:00" });
        setSubscriptionPackageName(res.data?.subscriptionPackageName ?? null);
        hasFetchedMerryListRef.current = true;
      } catch (err) {
        if (err.response?.status === 401) {
          router.replace("/login");
          return;
        }
        hasFetchedMerryListRef.current = false;
        setError(err.response?.data?.error || err.message || "โหลด Merry List ไม่สำเร็จ");
      } finally {
        isFetchingMerryListRef.current = false;
        setLoading(false);
      }
    };

    fetchMerryList();
  }, [isAuthenticated, authLoading, router]);

  const filteredProfiles = profiles.filter((profile) => {
    if (statusFilter === "notMatch") return profile.status === 0;
    if (statusFilter === "match") return profile.status === 1;
    // "latest" = แสดงทั้งหมด ตามลำดับล่าสุดจาก backend
    return true;
  });

  const handleClickMerryToYou = () => {
    const pkg = (subscriptionPackageName || "").toLowerCase();
    const isFreeOrBasic = pkg === "free" || pkg === "basic";

    // ถ้าไม่มี package หรือเป็น Free/Basic → แสดง mockup package (ไม่ไปหน้า merry-to-you)
    if (!pkg || isFreeOrBasic) {
      setShowPlanModal(true);
      return;
    }

    // มีแพ็กเกจที่สูงกว่า → ไปหน้า merry-to-you ได้เลย
    router.push("/merry-to-you?mode=sub");
  };

  const handleToggleUnlike = (profileId) => {
    if (!profileId) return;

    setTempUnlikedIds((prev) => {
      const next = prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId];
      writePendingUnlikesToStorage(next);
      return next;
    });
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
      console.error("Failed to open chat room from merry list:", err);
    } finally {
      setOpeningChatProfileId(null);
    }
  };
  return (
    <div>
      <NavBar />
      <div className="mx-auto w-full max-w-[933px] px-4">
        <div className="py-10 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-body2 text-beige-700 lg:text-beige-600 font-semibold">
                MERRY LIST
              </span>
              <h1 className="text-headline3 lg:text-headline2 text-purple-500 font-bold">
                Let’s know each other with Merry!
              </h1>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex w-full flex-row gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClickMerryToYou}
                  className="group relative flex w-full rounded-3xl border bg-white px-6 py-4 transition transform cursor-pointer hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 lg:w-[200px]"
                  aria-label="View people who merry you"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-1 lg:pb-2">
                      <p className="text-headline4 text-red-500 font-bold group-hover:text-red-600">
                        {formatNumber(merryToYou)}
                      </p>
                      <img
                        src="/merry_icon/icon-merry-to-you.svg"
                        alt="Merry to you icon"
                        className="w-6 h-6"
                      />
                    </div>
                    <p className="text-body2 text-start text-gray-700  font-medium  lg:-mt-2 group-hover:text-red-500 group-hover:underline">
                      Merry to you
                    </p>
                    <p className="text-body5 text-start text-gray-500 -mt-1 group-hover:text-red-500">
                      Tap to see who merry you
                    </p>
                  </div>
                </button>

                <div className="flex w-full rounded-3xl border bg-white px-6 py-4 lg:w-[200px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <p className="text-headline4 text-red-500 font-bold">
                        {formatNumber(merryMatch)}
                      </p>
                      <img
                        src="/merry_icon/icon-merry-match.svg"
                        alt="Merry match icon"
                        className="w-12 h-6"
                      />
                    </div>
                    <p className="text-body2 text-gray-700 font-medium ">
                      Merry match
                    </p>
                    <p className="text-body5 text-gray-400 -mt-1">
                      You&apos;re on this list now
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col items-end lg:items-end">
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

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body3 text-gray-600">Sort by</p>

              {/* Mobile: dropdown (using shared Select component) */}
              <div className="sm:hidden w-full">
                <div className="rounded-2xl border border-red-100 bg-red-50/70 p-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full rounded-xl border-red-200 bg-white px-4 text-body3 font-medium text-gray-800 shadow-none data-[size=default]:h-10 focus-visible:ring-red-200">
                      <SelectValue placeholder="Latest" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-red-100">
                      <SelectItem value="latest" className="text-body3">
                        Latest
                      </SelectItem>
                      <SelectItem value="match" className="text-body3">
                        Merry Match!
                      </SelectItem>
                      <SelectItem value="notMatch" className="text-body3">
                        Not Match yet
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desktop: segmented control */}
              <div className="hidden sm:inline-flex items-center rounded-full bg-red-50 p-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter("latest")}
                  className={`px-4 py-1.5 text-body3 rounded-full transition-colors cursor-pointer ${
                    statusFilter === "latest"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-white/70 hover:text-gray-900"
                  }`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("match")}
                  className={`px-4 py-1.5 text-body3 rounded-full transition-colors cursor-pointer ${
                    statusFilter === "match"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-white/70 hover:text-gray-900"
                  }`}
                >
                  Merry Match!
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("notMatch")}
                  className={`px-4 py-1.5 text-body3 rounded-full transition-colors cursor-pointer ${
                    statusFilter === "notMatch"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-white/70 hover:text-gray-900"
                  }`}
                >
                  Not Match yet
                </button>
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
                You haven't liked anyone yet — this list only shows people you've liked.
              </p>
              <p className="text-body2 text-gray-600">
                Go to Matching to like people you're interested in, and the list will appear here.
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
            filteredProfiles.length > 0 &&
            filteredProfiles.map((profile) => {
              const isTempUnliked = tempUnlikedIds.includes(profile.id);

              return (
                <MerryProfileCard
                  key={profile.id}
                  profile={profile}
                  onViewProfile={() => setSelectedProfileId(profile.id)}
                >
                  <div className="flex gap-3">
                    {profile.status === 1 && (
                      <ButtonGoToChat
                        iconClassName={`brightness-0 saturate-0 ${
                          openingChatProfileId === profile.id ? "opacity-30" : "opacity-60"
                        }`}
                        disabled={openingChatProfileId !== null}
                        onClick={() => handleGoToChat(profile.id)}
                      />
                    )}
                    <ButtonSeeProfile
                      iconClassName="brightness-0 saturate-0 opacity-60"
                      onClick={() => setSelectedProfileId(profile.id)}
                    />
                    <button
                      type="button"
                      aria-label="Already merry"
                      aria-pressed={!isTempUnliked}
                      className={`size-12 rounded-2xl shadow-(--shadow-button) p-0 inline-flex items-center justify-center cursor-pointer transition-all duration-500 ${
                        isTempUnliked
                          ? "bg-white hover:bg-white"
                          : "bg-red-500 hover:bg-red-500"
                      }`}
                      onClick={() => handleToggleUnlike(profile.id)}
                    >
                      <img
                        src="/merry_icon/icon-match-log.svg"
                        alt=""
                        className={`size-6 shrink-0 object-contain transition-all duration-500 ${
                          isTempUnliked ? "" : "brightness-0 invert"
                        }`}
                      />
                    </button>
                  </div>
                </MerryProfileCard>
              );
            })}

          {!loading && !error && profiles.length > 0 && filteredProfiles.length === 0 && (
            <div className="px-4 py-10 text-center text-body2 text-gray-600">
              No profiles in this filter yet.
            </div>
          )}
      </div>
      {/* Modal: แนะนำแพ็กเกจสำหรับ Merry to you (ไม่มีปุ่มกากบาท / กดรอบนอกไม่ปิด) */}
      {showPlanModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowPlanModal(false)}
        >
          <div
            className="w-fit rounded-[32px] bg-white p-6 shadow-2xl lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-headline4 font-bold text-purple-500">
                  See who merry you
                </h2>
                <p className="text-body3 text-gray-600 max-w-[373px] leading-relaxed">
                  Upgrade your plan to view all people who merry you in full detail and start matching with them.
                </p>
              </div>

              <div className="mx-auto grid w-full max-w-[380px] grid-cols-1 gap-4">
                {premiumPackage && (
                  <MerryPackageCard
                    {...premiumPackage}
                    buttonLabel="Choose Package"
                    onChoosePackage={(selected) => {
                      setShowPlanModal(false);
                      onChooseMembershipPackage(selected);
                    }}
                  />
                )}
              </div>

              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-body3 font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowPlanModal(false);
                    router.push("/payment");
                  }}
                >
                  View more packages
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded-full text-body3 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setShowPlanModal(false)}
                >
                  Back to Merry list
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <ProfilePopup
        open={Boolean(selectedProfileId)}
        onClose={() => setSelectedProfileId(null)}
        id={selectedProfileId}
        leftButton={<></>}
        rightButton={<></>}
      />
    </div>
  );
}
