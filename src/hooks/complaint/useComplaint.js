import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export function useComplaint(id) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchComplaint = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get(`/complaint/${id}`);
        let data = res.data;

        if (data.status === "new") {
          const updated = await apiClient.patch(`/complaint/${id}`, {
            status: "pending",
          });
          data = updated.data;
        }

        setComplaint(data);
      } catch (err) {
        setError(
          err.response?.data?.error || err.message || "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  return { complaint, setComplaint, loading, error };
}