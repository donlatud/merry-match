import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/apiClient";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import Image from "next/image";

function ComplaintPageId() {
  const router = useRouter();
  const { id } = router.query;
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusClasses = {
    new: "bg-beige-100 text-beige-700",
    pending: "bg-yellow-100 text-yellow-500",
    resolved: "bg-[#E7FFE7] text-[#197418]",
    cancelled: "bg-gray-200 text-gray-700",
  };
  const statusLabels = {
    new: "New",
    pending: "Pending",
    resolved: "Resolved",
    cancelled: "Cancelled",
  };

  useEffect(() => {
    if (!id) return;

    const fetchIssue = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/complaint/${id}`);
        const data = response.data;

        if (data.status === "new") {
          const updated = await apiClient.patch(`/complaint/${id}`, {
            status: "pending",
          });

          setComplaint(updated.data);
        } else {
          setComplaint(data);
        }
      } catch (err) {
        setError(
          err.response?.data?.error || err.message || "Something went wrong",
        );
        setComplaint(null);
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id]);
  console.log(complaint);
  return (
    <AdminLayout>
      {complaint && (
        <div className="h-screen">
          <div
            className="
      flex
      items-center
      justify-between
      py-4
      px-10
      h-20
    "
          >
            <div
              className="
          flex
          w-94.5
          gap-4"
            >
              <button
                onClick={() => {
                  router.push("/admin/complaint");
                }}
              >
                <Image
                  src="/merry_icon/icon-arrow-back.svg"
                  width={24}
                  height={24}
                />
              </button>
              <h4
                className="
        text-headline4
        font-bold
        text-gray-900"
              >
                {complaint.issue.length > 23
                  ? complaint.issue.slice(0, 23) + "..."
                  : complaint.issue}
              </h4>
              {/* Status */}

              <div
                className={`
            text-body5
            rounded-xl
            w-fit
            py-1
            px-2.5
            ${statusClasses[complaint.status]}
            `}
              >
                {statusLabels[complaint.status]}
              </div>
            </div>
            <div
              className="flex 
          items-center
          w-87.75
          gap-4"
            >
              <button
                className="py-1
              px-2
              text-[16px]
              font-bold
              text-red-500
              "
              >
                Cancel Complaint
              </button>
              <PrimaryButton className="">Resolve Complaint</PrimaryButton>
            </div>
          </div>
          <div
          className="
          bg-gray-100
          w-full

          ">
            <div
            className="
            bg-white
            py-10
            px-25
            w-270
            mx-auto">
              <span className="
              text-body1">Complaint by:<span>{complaint.user.username}</span></span>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default ComplaintPageId;
