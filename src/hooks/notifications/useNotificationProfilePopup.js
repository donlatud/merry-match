"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export function useNotificationProfilePopup({
  onPopupOpened,
  onPopupClosed,
  onRefresh,
  onMatch,
}) {
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [merrySubmitting, setMerrySubmitting] = useState(false);
  const [hasMatchedWithSelected, setHasMatchedWithSelected] = useState(false);
  const [checkingMatched, setCheckingMatched] = useState(false);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
    setSelectedProfileId(null);
    setMerrySubmitting(false);
    setHasMatchedWithSelected(false);
    setCheckingMatched(false);
    onPopupClosed?.();
  }, [onPopupClosed]);

  const openPopup = useCallback(
    (profileId) => {
      if (!profileId) return;
      setSelectedProfileId(profileId);
      setPopupOpen(true);
      onPopupOpened?.();
    },
    [onPopupOpened],
  );

  useEffect(() => {
    if (!popupOpen || !selectedProfileId) {
      setHasMatchedWithSelected(false);
      setCheckingMatched(false);
      return;
    }

    let cancelled = false;

    async function checkMatchedState() {
      setCheckingMatched(true);
      try {
        const res = await apiClient.get("/notifications", {
          params: { matchedRecipientId: selectedProfileId },
        });

        if (!cancelled) {
          setHasMatchedWithSelected(Boolean(res.data?.hasMatched));
        }
      } catch (error) {
        console.error("check matched notification error:", error);
        if (!cancelled) {
          setHasMatchedWithSelected(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingMatched(false);
        }
      }
    }

    checkMatchedState();

    return () => {
      cancelled = true;
    };
  }, [popupOpen, selectedProfileId]);

  const handleMerry = useCallback(async () => {
    if (!selectedProfileId || merrySubmitting) return;

    setMerrySubmitting(true);

    try {
      const { data } = await apiClient.post("/matching/swipe", {
        receiverId: selectedProfileId,
        status: "LIKE",
      });

      closePopup();
      onRefresh?.();

      if (data?.isMatch && selectedProfileId) {
        // แสดง MerryMatchModal แทนการไปแชททันที (ให้ parent เปิด modal หลัง 800ms)
        const profileId = selectedProfileId;
        setTimeout(() => {
          onMatch?.(profileId);
        }, 800);
      }
    } catch (error) {
      console.error("Merry from notification error:", error);
    } finally {
      setMerrySubmitting(false);
    }
  }, [closePopup, merrySubmitting, onRefresh, onMatch, selectedProfileId]);

  return {
    selectedProfileId,
    popupOpen,
    closePopup,
    openPopup,
    merrySubmitting,
    hasMatchedWithSelected,
    checkingMatched,
    handleMerry,
  };
}
