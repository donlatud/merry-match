"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/16/solid";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { AuthContext } from "@/contexts/login/AuthContext";
import { GhostButton } from "@/components/commons/button/GhostButton";
import Modal from "@/components/commons/modal/modal";
import { apiClient } from "@/lib/apiClient";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const EMPTY_BILLING_HISTORY = {
  nextBillingDate: null,
  transactions: [],
};

function formatDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB").format(date);
}

function formatStatusLabel(status) {
  if (!status) return "-";
  const lower = String(status).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatIntervalLabel(interval) {
  if (!interval) return "Month";
  const lower = String(interval).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function MembershipPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [billingHistoryData, setBillingHistoryData] = useState(
    EMPTY_BILLING_HISTORY,
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadMembershipPageData = useCallback(async () => {
    if (!user?.id) return;

    setPageLoading(true);
    setPageError("");

    const [membershipResult, historyResult] = await Promise.allSettled([
      apiClient.get("/membership/me"),
      apiClient.get("/membership/history"),
    ]);

    if (membershipResult.status === "fulfilled") {
      setMembershipData(membershipResult.value.data ?? null);
    } else {
      setMembershipData(null);
      setPageError(
        membershipResult.reason?.response?.data?.message ??
          membershipResult.reason?.response?.data?.error ??
          membershipResult.reason?.message ??
          "Failed to load membership data",
      );
    }

    // *** เปิด comment ด้านล่างเพื่อใช้ mock billing history สำหรับเทส UI ***
    // setBillingHistoryData({
    //   nextBillingDate: "2022-09-01T00:00:00.000Z",
    //   transactions: [
    //     { id: "mock-1", date: "2022-08-01", packageName: "Premium", amount: "149.00", currency: "THB", status: "PAID" },
    //     { id: "mock-2", date: "2022-07-01", packageName: "Premium", amount: "149.00", currency: "THB", status: "PAID" },
    //     { id: "mock-3", date: "2022-06-01", packageName: "Basic", amount: "59.00", currency: "THB", status: "PAID" },
    //     { id: "mock-4", date: "2022-05-01", packageName: "Basic", amount: "59.00", currency: "THB", status: "PAID" },
    //     { id: "mock-5", date: "2022-04-01", packageName: "Basic", amount: "59.00", currency: "THB", status: "PAID" },
    //   ],
    // });

    if (historyResult.status === "fulfilled") {
      setBillingHistoryData(historyResult.value.data ?? EMPTY_BILLING_HISTORY);
    } else {
      setBillingHistoryData(EMPTY_BILLING_HISTORY);
      setPageError((currentError) => {
        if (currentError) return currentError;
        return (
          historyResult.reason?.response?.data?.message ??
          historyResult.reason?.response?.data?.error ??
          historyResult.reason?.message ??
          "Failed to load billing history"
        );
      });
    }

    setPageLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadMembershipPageData();
  }, [user?.id, loadMembershipPageData]);

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

  const membership = membershipData?.membership ?? null;
  const membershipPackage = membership?.package ?? null;
  const canCancelMembership = membershipData?.status === "ACTIVE";
  const packageBenefits = Array.isArray(membershipPackage?.features)
    ? membershipPackage.features
    : [];
  const packageSummary = {
    name:
      membershipPackage?.name ??
      membershipData?.packageName ??
      "No active package",
    price: membershipPackage?.price ?? "0.00",
    currency: membershipPackage?.currency ?? "THB",
    interval: formatIntervalLabel(membershipPackage?.billingInterval),
    icon_url: membershipPackage?.iconUrl ?? null,
    benefits: packageBenefits,
    startDate: formatDisplayDate(membership?.startDate),
    nextBilling: formatDisplayDate(
      membership?.nextBillingDate ?? billingHistoryData?.nextBillingDate,
    ),
    status: formatStatusLabel(membershipData?.status),
  };
  const billingNextBilling = formatDisplayDate(
    billingHistoryData?.nextBillingDate ?? membership?.nextBillingDate,
  );
  const billingTransactions = Array.isArray(billingHistoryData?.transactions)
    ? billingHistoryData.transactions.map((transaction) => ({
        id: transaction.id,
        date: formatDisplayDate(transaction.date),
        packageName:
          transaction.packageName ??
          membershipData?.packageName ??
          "Unknown package",
        price: transaction.amount ?? "0.00",
        currency: transaction.currency ?? "THB",
      }))
    : [];

  if (pageLoading) {
    return (
      <>
        <NavBar />
        <section className="min-h-screen bg-utility-white lg:bg-utility-bg-main flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Confirmation"
        message="Do you sure to cancel Merry Membership?"
        leftText="Yes, I want to cancel"
        rightText="No, I still want to be member"
        onLeftClick={() => {
          // TODO: เรียก API ยกเลิก subscription ภายหลัง
          setCancelModalOpen(false);
        }}
        onRightClick={() => setCancelModalOpen(false)}
        type="secondary"
      />
      <NavBar />
      <section className="bg-utility-white lg:bg-utility-bg-main">
        <div className="flex items-center justify-center">
          <div className="w-[375px] lg:w-full">
            <div className="flex flex-col items-start justify-center gap-10 lg:gap-20 h-fit w-fit px-4 py-10 lg:py-20 lg:mx-auto">
              {/* Page title — mobile first, responsive desktop */}
              <div className="flex flex-col items-start justify-center gap-2 lg:gap-4 w-[343px] lg:w-[930px]">
                {pageError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body4 text-red-600 w-full">
                    {pageError}
                  </p>
                ) : null}
                <p className="text-body1 text-[14px] uppercase text-beige-700">
                  MERRY MEMBERSHIP
                </p>
                <h2 className="text-headline3 lg:text-headline2 text-purple-500">
                  Manage your membership <br /> and payment method
                </h2>
              </div>
              {/* 1. Merry Membership Package — mobile: stacked, desktop: same */}
              <div className="flex flex-col items-start justify-center gap-6 w-[343px] lg:w-[930px]">
                <h4 className="text-headline4 text-gray-900">
                  Merry Membership Package
                </h4>
                <div className="w-full rounded-[24px] lg:rounded-[32px] p-4 lg:px-8 lg:pt-8 lg:pb-6 bg-utility-linear overflow-hidden border border-gray-400 lg:border-none lg:shadow-button">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:border-b lg:border-purple-300 lg:pb-10">
                    {/* Mobile: icon + name + price (parent ตรงนี้เป็น div บรรทัด 70) */}
                    <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[16px] bg-gray-100 lg:hidden">
                      {packageSummary.icon_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={packageSummary.icon_url}
                          alt=""
                          className="h-9 w-9 object-contain"
                        />
                      ) : null}
                    </div>
                    <div className="lg:hidden flex flex-col gap-2">
                      <h3 className="text-headline3 text-utility-white">
                        {packageSummary.name}
                      </h3>
                      <p className="text-body1 text-purple-100">
                        {packageSummary.currency} {packageSummary.price}
                        <span className="text-body2 text-purple-100">
                          {" "}
                          /{packageSummary.interval}
                        </span>
                      </p>
                    </div>
                    {/* Desktop: icon + name + price */}
                    <div className="hidden lg:w-[319px] lg:gap-4 lg:flex lg:flex-row">
                      <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[16px] bg-gray-100">
                        {packageSummary.icon_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={packageSummary.icon_url}
                            alt=""
                            className="h-10 w-10 object-contain"
                          />
                        ) : null}
                      </div>
                      <div className="lg:flex lg:flex-col lg:justify-center lg:gap-2 lg:w-[225px]">
                        <h3 className="text-headline3 text-utility-white">
                          {packageSummary.name}
                        </h3>
                        <p className="text-body1 text-purple-200">
                          {packageSummary.currency} {packageSummary.price}
                          <span className="ml-[6px] text-body2 text-purple-200">
                            /{packageSummary.interval}
                          </span>
                        </p>
                      </div>
                    </div>

                    <ul className="flex w-full flex-col gap-4 pb-9 border-b border-gray-300 lg:pb-0 lg:border-none lg:gap-2 lg:w-[357px] lg:h-[78px] lg:justify-center lg:items-start">
                      {packageSummary.benefits.length > 0 ? (
                        packageSummary.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className="flex flex-row items-center gap-3"
                          >
                            <CheckCircleIcon className="size-4 shrink-0 text-purple-300" />
                            <span className="text-body2 text-purple-100">
                              {benefit}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="flex flex-row items-center gap-3">
                          <CheckCircleIcon className="size-4 shrink-0 text-purple-300" />
                          <span className="text-body2 text-purple-100">
                            No package benefits available
                          </span>
                        </li>
                      )}
                    </ul>
                    <span className="hidden lg:inline-flex w-fit rounded-[99px] bg-beige-200 px-4 py-1 text-body3 font-extrabold text-beige-600 gap-1 lg:shrink-0">
                      {packageSummary.status}
                    </span>
                  </div>
                  {/* <div className="mt-4 flex flex-col text-body2 lg:hidden">
                <span className="flex justify-between py-1 text-purple-200">
                  Start Membership{" "}
                  <span className="text-utility-white">
                    {PLACEHOLDER_PACKAGE.startDate}
                  </span >
                </span>
                <span className="flex justify-between py-1 text-purple-200">
                  Next billing{" "}
                  <span className="text-utility-white">
                    {PLACEHOLDER_PACKAGE.nextBilling}
                  </span>
                </span>
              </div> */}
                  {canCancelMembership ? (
                    <div className="pt-4 pr-6 flex flex-row justify-end">
                      <GhostButton
                        type="button"
                        showIcon={false}
                        className="text-utility-white hover:text-purple-200 cursor-pointer"
                        onClick={() => setCancelModalOpen(true)}
                      >
                        Cancel Package
                      </GhostButton>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 2. Billing History */}
              {/* Desktop */}
              <div className="hidden lg:flex flex-col items-start justify-center gap-6 w-full">
                <div className="flex flex-col items-start justify-center w-full gap-2 py-0 px-0 border-none">
                  <h4 className="text-headline4 text-gray-900 w-full">
                    Billing History
                  </h4>
                </div>
                <div className="w-full flex flex-col border border-gray-400 bg-utility-white rounded-[32px] px-8 pt-8 pb-12 gap-4">
                  <p className="w-[866px] border-b border-gray-300 py-2 text-body1 text-gray-700">
                    Next billing : {billingNextBilling}
                  </p>
                  <ul className="flex flex-col divide-y divide-gray-100 border-b border-gray-300 pb-4">
                    {billingTransactions.length > 0 ? (
                      billingTransactions.map((tx, i) => (
                        <li
                          key={tx.id ?? i}
                          className={`flex flex-wrap items-center justify-between w-[866px] gap-4 p-4 text-body3 text-gray-600 ${i % 2 === 1 ? "bg-gray-100 rounded-[8px]" : ""}`}
                        >
                          <span className="w-[104px]">{tx.date}</span>
                          <span className="w-[609px] text-left">
                            {tx.packageName}
                          </span>
                          <span className="w-[89px] text-right text-gray-800">
                            {tx.currency} {tx.price}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="w-[866px] p-4 text-body3 text-gray-500">
                        No billing history available
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            {/* Mobile */}
            <div className="flex flex-col items-start justify-center pb-18 lg:hidden">
              <div className="flex flex-col items-start justify-center w-full gap-2 py-2 border-b border-gray-300 lg:py-0 px-0 lg:border-none">
                <h4 className="text-headline4 text-gray-900 w-[343px] px-4">
                  Billing History
                </h4>
                <p className="text-body1 text-gray-700 w-[343px] px-4">
                  Next billing : {billingNextBilling}
                </p>
              </div>
              <div className="w-full border-b border-gray-300 bg-utility-white">
                <ul className="flex flex-col divide-y divide-gray-100">
                  {billingTransactions.length > 0 ? (
                    billingTransactions.map((tx, i) => (
                      <li
                        key={tx.id ?? i}
                        className={`flex flex-wrap items-center justify-between gap-4 p-4 text-body2 text-gray-700 ${i % 2 === 1 ? "bg-gray-100" : ""}`}
                      >
                        <span className="w-[104px]">{tx.date}</span>
                        <span className="w-[118px] text-left">
                          {tx.packageName}
                        </span>
                        <span className="w-[89px] text-right text-gray-800">
                          {tx.currency} {tx.price}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-body2 text-gray-500">
                      No billing history available
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
