"use client";

import { CheckCircleIcon } from "@heroicons/react/16/solid";
import { GhostButton } from "@/components/commons/button/GhostButton";
import {
  formatDisplayDate,
  formatExpiresInDays,
} from "@/lib/membershipHelpers";

/**
 * เนื้อหาหลักหน้า Membership (title, package card, billing history)
 * layout และการแสดงผลเหมือนเดิม — แยกจากหน้า membership เพื่อลดความยาวไฟล์
 */
export function MembershipContent({
  pageError,
  packageSummary,
  canCancelMembership,
  isCancelledStatus,
  membership,
  billingNextBilling,
  billingTransactions,
  onCancelClick,
  onViewPackagesClick,
}) {
  return (
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
                Manage your membership package
              </h2>
            </div>
            {/* 1. Merry Membership Package — mobile: stacked, desktop: same */}
            <div className="flex flex-col items-start justify-center gap-6 w-[343px] lg:w-[930px]">
              <h4 className="text-headline4 text-gray-900">
                Merry Membership Package
              </h4>
              <div className="relative w-full rounded-[24px] lg:rounded-[32px] p-4 lg:px-8 lg:pt-8 lg:pb-6 bg-utility-linear overflow-hidden border border-gray-400 lg:border-none lg:shadow-button">
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
                  <span className="absolute top-4 right-4 lg:static inline-flex w-fit rounded-[99px] bg-beige-200 px-4 py-1 text-body3 font-extrabold text-beige-600 gap-1 lg:shrink-0">
                    {packageSummary.status}
                  </span>
                </div>
                {canCancelMembership ? (
                  <div className="pt-4 pr-6 flex flex-row justify-end">
                    <GhostButton
                      type="button"
                      showIcon={false}
                      className="text-utility-white hover:text-purple-200 cursor-pointer"
                      onClick={onCancelClick}
                    >
                      Cancel Package
                    </GhostButton>
                  </div>
                ) : isCancelledStatus ? (
                  <div className="pt-2 lg:pt-4 flex flex-col justify-start items-end lg:flex-row lg:justify-between lg:items-center">
                    {/* ส่วน CANCELLED */}
                    {/* Mobile - expires in days */}
                    <p className="pb-2 text-body2 text-red-300 lg:hidden">
                      Your membership expires{" "}
                      <span className="text-utility-white font-bold animate-[pulse_3s_ease-in-out_infinite]">
                        {formatExpiresInDays(membership?.nextBillingDate)}
                      </span>{" "}
                    </p>

                    {/* Desktop - expires in days */}
                    <p className="pt-1 text-body2 text-red-300 hidden lg:block">
                      Your{" "}
                      <span className="text-utility-white font-bold">
                        {packageSummary.name}
                      </span>{" "}
                      membership expires{" "}
                      <span className="text-utility-white font-bold animate-[pulse_3s_ease-in-out_infinite]">
                        {formatExpiresInDays(membership?.nextBillingDate)}
                      </span>{" "}
                      ({formatDisplayDate(membership?.nextBillingDate)})
                    </p>

                    <div className="flex flex-row justify-end pr-8">
                      <GhostButton
                        type="button"
                        showIcon={false}
                        className="text-utility-white hover:text-purple-200 cursor-pointer"
                        onClick={onViewPackagesClick}
                      >
                        View All Packages
                      </GhostButton>
                    </div>
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
                  Next billing : {isCancelledStatus ? "—" : billingNextBilling}
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
                Next billing : {isCancelledStatus ? "—" : billingNextBilling}
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
  );
}
