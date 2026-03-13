"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { EMPTY_BILLING_HISTORY } from "@/lib/membershipHelpers";

/**
 * โหลดข้อมูลหน้า membership (GET /membership/me + GET /membership/history)
 * แยกจากหน้า membership เพื่อลดความยาวและทดสอบได้ง่าย
 *
 * @param {string | undefined | null} userId
 * @returns {{ membershipData: object | null, billingHistoryData: object, loading: boolean, error: string, reload: () => Promise<void> }}
 */
export function useMembershipPageFetch(userId) {
  const [membershipData, setMembershipData] = useState(null);
  const [billingHistoryData, setBillingHistoryData] = useState(
    EMPTY_BILLING_HISTORY,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    const [membershipResult, historyResult] = await Promise.allSettled([
      apiClient.get("/membership/me"),
      apiClient.get("/membership/history"),
    ]);

    if (membershipResult.status === "fulfilled") {
      setMembershipData(membershipResult.value.data ?? null);
    } else {
      setMembershipData(null);
      setError(
        membershipResult.reason?.response?.data?.message ??
          membershipResult.reason?.response?.data?.error ??
          membershipResult.reason?.message ??
          "Failed to load membership data",
      );
    }

    if (historyResult.status === "fulfilled") {
      setBillingHistoryData(historyResult.value.data ?? EMPTY_BILLING_HISTORY);
    } else {
      setBillingHistoryData(EMPTY_BILLING_HISTORY);
      setError((currentError) => {
        if (currentError) return currentError;
        return (
          historyResult.reason?.response?.data?.message ??
          historyResult.reason?.response?.data?.error ??
          historyResult.reason?.message ??
          "Failed to load billing history"
        );
      });
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    reload();
  }, [userId, reload]);

  return {
    membershipData,
    billingHistoryData,
    loading,
    error,
    reload,
  };
}
