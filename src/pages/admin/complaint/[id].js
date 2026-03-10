import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import Image from "next/image";
import { format } from "date-fns";
import Modal from "@/components/commons/modal/modal";
import { useComplaint } from "@/hooks/complaint/useComplaint";
import { useComplaintActions } from "@/hooks/complaint/useComplaintAction";
import { Loading } from "@/components/commons/Loading/Loading";

function ComplaintPageId() {
  const router = useRouter();
  const { id } = router.query;

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

  const { complaint, setComplaint, loading, error } = useComplaint(id);
  const { resolveComplaint, cancelComplaint } = useComplaintActions(
    id,
    setComplaint,
  );

  const [modalAction, setModalAction] = useState(null);

  const modalConfig = {
    resolve: {
      title: "Resolve Complaint",
      message: "This complaint resolved?",
      leftText: "Yes, it has been resolved",
      rightText: "No, it's not",
      action: resolveComplaint,
    },
    cancel: {
      title: "Cancel Complaint",
      message: "Are you sure to cancel this complaint?",
      leftText: "Yes, cancel this complaint",
      rightText: "No, give me mpre time",
      action: cancelComplaint,
    },
  };
  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout>Error: {error}</AdminLayout>;
  if (!complaint) return null;
  return (
    <AdminLayout>
      {complaint && (
        <div className="h-screen flex flex-col">
          <div className="flex items-center justify-between py-4 px-15 h-20 border-b shadow-sm">
            <div className="flex w-94.5 gap-4">
              <button
                onClick={() => {
                  router.push("/admin/complaint");
                }}
                className="cursor-pointer"
              >
                <Image
                  src="/merry_icon/icon-arrow-back.svg"
                  width={24}
                  height={24}
                  alt="arrow-back"
                />
              </button>
              <h4 className="text-headline4 font-bold text-gray-900">
                {complaint.issue.length > 23
                  ? complaint.issue.slice(0, 23) + "..."
                  : complaint.issue}
              </h4>
              {/* Status */}
              <div
                className={`text-body5 rounded-xl w-fit py-1 px-2.5 ${statusClasses[complaint.status]}`}
              >
                {statusLabels[complaint.status]}
              </div>
            </div>
            <div
              className={`flex items-center w-87.75 gap-4 ${complaint.status === "pending" ? "" : "hidden"}`}
            >
              <button
                className="py-1 px-2 text-[16px] font-bold text-red-500 cursor-pointer "
                onClick={() => setModalAction("cancel")}
              >
                Cancel Complaint
              </button>
              <PrimaryButton
                className="cursor-pointer text-[16px]"
                onClick={() => setModalAction("resolve")}
              >
                Resolve Complaint
              </PrimaryButton>
            </div>
          </div>
          <div className="flex-1 bg-gray-100 px-15 py-6">
            <div className="bg-white py-10 px-25 w-full mx-auto flex flex-col gap-10 rounded-2xl shadow-sm h-fit">
              {/* Complaint Username */}
              <span className="text-body1 text-gray-700">
                Complaint by:
                <span className="text-body2 text-black">
                  {complaint.user.username}
                </span>
              </span>

              <hr className="shrink-0" />
              {/* Issue */}
              <div className="flex flex-col gap-2">
                <span className="text-body1 font-semibold text-gray-700">
                  Issue
                </span>
                <span className="text-body2 text-black">{complaint.issue}</span>
              </div>
              {/* Description */}
              <div className="flex flex-col gap-2 w-220">
                <span className="text-body1 font-semibold text-gray-700">
                  Description
                </span>
                <span className="text-body2 text-black">
                  {complaint.description}
                </span>
              </div>
              {/* Date Submitted */}
              <div className="flex flex-col gap-2 w-220">
                <span className="text-body1 font-semibold text-gray-700">
                  Date Submitted
                </span>
                <span className="text-body2 text-black pb-10">
                  {format(new Date(complaint.createdAt), "dd/MM/yyyy")}
                </span>
                {complaint.status !== "pending" && (
                  <div className="flex flex-col gap-10">
                    <hr className="shrink-0" />
                    <div className="flex flex-col gap-2">
                      <span className="text-body1 font-semibold text-gray-700">
                        {statusLabels[complaint.status]} Submitted
                      </span>
                      <span className="text-body2 text-black">
                        {complaint.status === "resolved"
                          ? format(new Date(complaint.resolvedAt), "dd/MM/yyyy")
                          : format(
                              new Date(complaint.cancelledAt),
                              "dd/MM/yyyy",
                            )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Modal
            open={!!modalAction}
            onClose={() => setModalAction(null)}
            title={modalConfig[modalAction]?.title}
            message={modalConfig[modalAction]?.message}
            leftText={modalConfig[modalAction]?.leftText}
            rightText={modalConfig[modalAction]?.rightText}
            onLeftClick={async () => {
              await modalConfig[modalAction]?.action();
              setModalAction(null);
            }}
            onRightClick={() => setModalAction(null)}
            type="primary"
          />
        </div>
      )}
    </AdminLayout>
  );
}

export default ComplaintPageId;
