"use client";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Modal from "@/components/commons/modal/modal";
import { MerryPackageCard } from "@/components/payment/MerryPackageCard";
import { usePackageSelection } from "@/hooks/payment/usePackageSelection";

export default function MerryPackageSection() {
  const {
    packages,
    loading,
    error,
    checkoutError,
    checkoutingPackageId,
    onChoosePackage,
    changePlanModal,
  } = usePackageSelection();

  return (
    <>
      <NavBar />

      <main >
        
        <section
          aria-labelledby="merry-membership-heading"
          className="flex justify-center bg-utility-bg-main w-full  py-10 lg:pt-[80px] lg:pb-[160px]"
        >
          <div className="flex max-w-[1440px] w-full flex-col gap-[43px] px-4 lg:gap-[80px]">
            {/* Hero / Heading */}
            <header className="w-full">
              {/* Mobile heading */}
              <div className="lg:hidden flex flex-col gap-2">
                <div className="text-tagline text-[14px] font-semibold uppercase  text-beige-700">
                  Merry Membership
                </div>
                <div
                  id="merry-membership-heading"
                  className="text-headline3 text-purple-500"
                >
                  Join us and start matching
                </div>
              </div>

              {/* Desktop heading */}
              <div className="hidden lg:px-[160px] lg:flex lg:flex-col lg:gap-2 lg:w-[1119px]">
                <div className="text-tagline text-[14px] font-semibold uppercase  text-beige-700">
                  Merry Membership
                </div>
                <div
                  id="merry-membership-heading-desktop"
                  className="text-headline2 text-purple-500"
                >
                  Be part of Merry Membership to make more Merry!
                </div>
              </div>
            </header>

            {/* Package cards */}
            <section
              aria-label="Merry packages"
              className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:px-[160px]"
            >
              {loading && (
                <p className="col-span-full text-body2 text-gray-600">
                  Loading packages…
                </p>
              )}
              {error && (
                <p className="col-span-full text-body2 text-red-600" role="alert">
                  {error}
                </p>
              )}
              {checkoutError && (
                <p className="col-span-full text-body2 text-red-600" role="alert">
                  {checkoutError}
                </p>
              )}
              {!loading && !error && packages.length === 0 && (
                <p className="col-span-full text-body2 text-gray-600">
                  No packages available.
                </p>
              )}
              {!loading &&
                !error &&
                packages.map((pkg) => (
                  <MerryPackageCard
                    key={pkg.id}
                    {...pkg}
                    onChoosePackage={onChoosePackage}
                    isCheckingOut={checkoutingPackageId === pkg.id}
                  />
                ))}
            </section>
          </div>
        </section>
      </main>

      <Modal
        open={changePlanModal.open}
        onClose={changePlanModal.onCancel}
        title="Change package"
        message={changePlanModal.message}
        leftText="Cancel"
        rightText="Confirm"
        onLeftClick={changePlanModal.onCancel}
        onRightClick={changePlanModal.onConfirm}
        type="secondary"
        fullWidthButtons
      />

      <Footer />
    </>
  );
}
