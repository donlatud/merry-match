import { apiClient } from "@/lib/apiClient";

export function useComplaintActions(id, setComplaint) {
  const resolveComplaint = async () => {
    const res = await apiClient.patch(`/admin/complaint/${id}`, {
      status: "resolved",
    });
    setComplaint(res.data);
  };

  const cancelComplaint = async () => {
    const res = await apiClient.patch(`/admin/complaint/${id}`, {
      status: "cancelled",
    });
    setComplaint(res.data);
  };

  return { resolveComplaint, cancelComplaint };
}