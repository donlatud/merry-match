"use client";

import { useCallback, useState } from "react";
import { apiClient } from "@/lib/apiClient";

/**
 * จัดการ flow ยกเลิก membership (POST /membership/cancel)
 * แยกจากหน้า membership เพื่อลดความยาวและแยก responsibility
 *
 * @param {{ setCancelError: (msg: string) => void, onSuccess: () => void | Promise<void>, onCloseModal: () => void }}
 * @returns {{ cancel: () => Promise<void>, cancelSubmitting: boolean }}
 */
export function useCancelMembership({
  setCancelError,
  onSuccess,
  onCloseModal,
}) {
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const cancel = useCallback(async () => {
    if (cancelSubmitting) return;

    setCancelSubmitting(true);
    setCancelError("");

    try {
      await apiClient.post("/membership/cancel");
      onCloseModal();
      await onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.message ??
        err.response?.data?.error ??
        err.message ??
        "Failed to cancel membership";
      setCancelError(message);
      onCloseModal();
    } finally {
      setCancelSubmitting(false);
    }
  }, [
    cancelSubmitting,
    setCancelError,
    onSuccess,
    onCloseModal,
  ]);

  return { cancel, cancelSubmitting };
}
