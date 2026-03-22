"use client";

import { useMemo } from "react";
import {
  formatDisplayDate,
  formatStatusLabel,
  formatIntervalLabel,
} from "@/lib/membershipHelpers";

/**
 * Derived data สำหรับหน้า membership (packageSummary, billingTransactions, flags)
 * แยกจากหน้า membership เพื่อลดความยาวและใช้ format helpers จาก lib
 *
 * @param {object|null} membershipData - response จาก GET /api/membership/me
 * @param {object} billingHistoryData - { nextBillingDate, transactions } จาก GET /api/membership/history
 * @returns {{ membership, packageSummary, billingNextBilling, billingTransactions, canCancelMembership, isCancelledStatus }}
 */
export function useMembershipPageData(membershipData, billingHistoryData) {
  return useMemo(() => {
    const membership = membershipData?.membership ?? null;
    const membershipPackage = membership?.package ?? null;
    const isCancelledStatus = membershipData?.status === "CANCELLED";
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

    const billingTransactions = Array.isArray(
      billingHistoryData?.transactions,
    )
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

    return {
      membership,
      packageSummary,
      billingNextBilling,
      billingTransactions,
      canCancelMembership,
      isCancelledStatus,
    };
  }, [membershipData, billingHistoryData]);
}
