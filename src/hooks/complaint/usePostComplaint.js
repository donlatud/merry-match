import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

export function usePostComplaint() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createIssue = async ({ issue, description }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/admin/complaint", {
        issue,
        description,
      });

      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Something went wrong";

      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createIssue, loading, error };
}