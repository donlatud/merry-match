"use client";

import { useState, useCallback } from "react";
import axios from "axios";

const REGISTER_API = "/api/auth/register";

/**
 * Hook สำหรับส่ง POST register (FormData: payload + photos)
 * @returns {{ submit: (payloadForApi: { step1: object; step2: object }, photoFiles: File[]) => Promise<{ success: boolean; userId: string }>, isSubmitting: boolean }}
 */
export function useRegisterSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (payloadForApi, photoFiles) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("payload", JSON.stringify(payloadForApi));
        const files = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
        files.forEach((file) => {
          if (file instanceof File) formData.append("photos", file);
        });

        const { data } = await axios.post(REGISTER_API, formData);
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { submit, isSubmitting };
}
