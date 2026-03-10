import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { AuthContext } from "@/contexts/login/AuthContext";
import { supabase } from "@/providers/supabase.provider";
import { ButtonSeeProfile } from "@/components/commons/button/IconButton";
import { ButtonGoToChat } from "@/components/commons/button/IconButton";
import { ButtonMerry } from "@/components/commons/button/IconButton";
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
  const [unmerryModalOpen, setUnmerryModalOpen] = useState(false);
  const [pendingUnmerryId, setPendingUnmerryId] = useState(null);
  const [unmerriedIds, setUnmerriedIds] = useState([]);

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

    const fetchMerryList = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;
        const res = await axios.get("/api/merrylist", {
          headers: getAuthHeaders(token),
        });
        setProfiles(res.data?.list ?? []);
        setMerryToYou(res.data?.merryToYou ?? 0);
        setMerryMatch(res.data?.merryMatch ?? 0);
        setMerryLimit(res.data?.merryLimit ?? { used: 0, total: 20, resetAt: "00:00" });
        setSubscriptionPackageName(res.data?.subscriptionPackageName ?? null);
      } catch (err) {
        if (err.response?.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err.response?.data?.error || err.message || "โหลด Merry List ไม่สำเร็จ");
      } finally {
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

  return (
    <div>
      <NavBar />
      <div className="flex justify-center">
        <div className="flex justify-center flex-col lg:w-[933px]">
          <div className="py-10 px-4 gap-10 flex flex-col">
            <div className="flex flex-col gap-2">
              <span className="text-body2 text-beige-700 lg:text-beige-600 font-semibold">
                MERRY LIST
              </span>
              <h1 className="text-headline3 lg:text-headline2 text-purple-500 font-bold">
                Let’s know each other with Merry!
              </h1>
            </div>
            <div className="flex flex-col lg:flex-row  lg:items-end gap-4">
              <div className="gap-4 w-full flex flex-row sm:flex-row">
                <button
                  type="button"
                  onClick={handleClickMerryToYou}
                  className="group border relative px-6 py-4 w-full lg:w-[200px] rounded-3xl flex cursor-pointer bg-white transition transform hover:-translate-y-0.5 hover:shadow-md hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2"
                  aria-label="View people who merry you"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1 lg:pb-2">
                      <p className="text-headline4 text-red-500 font-bold group-hover:text-red-600">
                        {formatNumber(merryToYou)}
                      </p>
                      <img
                        src="/merry_icon/icon-merry-to-you.svg"
                        alt="Merry to you icon"
                        className="w-6 h-6"
                      />
                    </div>
                    <p className="text-body2 text-gray-700 font-medium -mt-2 group-hover:text-red-500 group-hover:underline">
                      Merry to you
                    </p>
                  </div>
                </button>

                <div className="border px-6 py-4 w-full rounded-3xl lg:w-[200px] flex bg-white">
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
                    <p className="text-body2 text-gray-700 font-medium">
                      Merry match
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full lg:w-full items-end lg:items-end">
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
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
                onClick={() => router.push("/matching-page")}
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
              const isUnmerried = unmerriedIds.includes(profile.id);
              return (
                <MerryProfileCard
                  key={profile.id}
                  profile={profile}
                  onViewProfile={() => setSelectedProfileId(profile.id)}
                >
                  <div className="flex gap-3">
                    <ButtonGoToChat iconClassName="brightness-0 saturate-0 opacity-60" />
                    <ButtonSeeProfile
                      iconClassName="brightness-0 saturate-0 opacity-60"
                      onClick={() => setSelectedProfileId(profile.id)}
                    />
                    {isUnmerried ? (
                      <ButtonMerry />
                    ) : (
                      <button
                        type="button"
                        aria-label="Already merry"
                        className="size-12 rounded-2xl bg-red-500 shadow-(--shadow-button) p-0 inline-flex items-center justify-center cursor-pointer"
                        onClick={() => {
                          setPendingUnmerryId(profile.id);
                          setUnmerryModalOpen(true);
                        }}
                      >
                        <img
                          src="/merry_icon/icon-match-log.svg"
                          alt=""
                          className="size-6 shrink-0 object-contain brightness-0 invert"
                        />
                      </button>
                    )}
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
      </div>
      {/* Modal: แนะนำแพ็กเกจสำหรับ Merry to you (ไม่มีปุ่มกากบาท / กดรอบนอกไม่ปิด) */}
      {showPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowPlanModal(false)}
        >
          <div
            className="bg-white rounded-[32px] w-auto max-w-full shadow-2xl p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-headline4 w-fit font-bold text-gray-900">
                  See everyone who merry you
                </h2>
                <p className="text-body3 text-gray-600 max-w-[373px] leading-relaxed">
                  Upgrade your plan to view all people who merry you in full detail and start matching with them.
                </p>
              </div>

              <div className="grid grid-cols-1 w-full gap-4 lg:grid-cols-1">
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

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-body3 font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowPlanModal(false);
                    router.push("/membership");
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

      {/* TODO: unmerry modal will be reintroduced with real API in future */}
    </div>
  );
}
