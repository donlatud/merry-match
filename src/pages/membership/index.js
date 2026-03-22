"use client";

import { useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/login/AuthContext";
import { useMembershipPageData } from "@/hooks/membership/useMembershipPageData";
import { useMembershipPageFetch } from "@/hooks/membership/useMembershipPageFetch";
import { useCancelMembership } from "@/hooks/membership/useCancelMembership";
import { CancelConfirmModal } from "@/components/membership/CancelConfirmModal";
import { MembershipContent } from "@/components/membership/MembershipContent";
import { Loading } from "@/components/commons/Loading/Loading";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function MembershipPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const {
    membershipData,
    billingHistoryData,
    loading: pageLoading,
    error: fetchError,
    reload,
  } = useMembershipPageFetch(user?.id);

  const {
    membership,
    packageSummary,
    billingNextBilling,
    billingTransactions,
    canCancelMembership,
    isCancelledStatus,
  } = useMembershipPageData(membershipData, billingHistoryData);

  const clearCancelErrorAndReload = useCallback(() => {
    setCancelError("");
    reload();
  }, [reload]);

  const { cancel, cancelSubmitting } = useCancelMembership({
    setCancelError,
    onSuccess: clearCancelErrorAndReload,
    onCloseModal: () => setCancelModalOpen(false),
  });

  const pageError = fetchError || cancelError;

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-utility-bg">
        <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (pageLoading) {
    return (
      <>
        <NavBar />
        <section className="min-h-screen bg-utility-white lg:bg-utility-bg-main flex items-center justify-center">
          <Loading />
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <CancelConfirmModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onLeftClick={cancel}
        onRightClick={() => setCancelModalOpen(false)}
      />
      <NavBar />
      <MembershipContent
        pageError={pageError}
        packageSummary={packageSummary}
        canCancelMembership={canCancelMembership}
        isCancelledStatus={isCancelledStatus}
        membership={membership}
        billingNextBilling={billingNextBilling}
        billingTransactions={billingTransactions}
        onCancelClick={() => setCancelModalOpen(true)}
        onViewPackagesClick={() => router.push("/payment")}
      />
      <Footer />
    </>
  );
}
