import Script from "next/script";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { MembershipSummaryCard } from "@/components/payment/MembershipSummaryCard";
import { PaymentMethodSelector } from "@/components/payment/PaymentMethodSelector";
import { CreditCardForm } from "@/components/payment/CreditCardForm";
import { QrCodeArea } from "@/components/payment/QrCodeArea";
import { QrPaymentStatus } from "@/components/payment/QrPaymentStatus";
import { usePaymentCheckout } from "@/hooks/payment/usePaymentCheckout";

export default function PaymentCheckoutPage() {
  const {
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    features,
    priceLabel,
    summaryMode,
    summaryCurrentPackageName,
    packageName,
    qr,
    useOmiseScript,
    handlePaymentConfirm,
    handleCancel,
  } = usePaymentCheckout();

  const summaryCard = (
    <MembershipSummaryCard
      packageName={packageName}
      mode={summaryMode}
      currentPackageName={summaryCurrentPackageName}
      priceLabel={priceLabel}
      features={features}
    />
  );

  const methodSelector = (
    <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
  );

  const paymentForm =
    paymentMethod === "card" ? (
      <CreditCardForm
        onSubmit={handlePaymentConfirm}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    ) : (
      <QrCodeArea title="Pay with QR (PromptPay)">
        <QrPaymentStatus
          redirecting={qr.redirecting}
          loading={qr.loading}
          error={qr.error}
          imageUrl={qr.imageUrl}
        />
      </QrCodeArea>
    );

  return (
    <>
      {useOmiseScript && (
        <Script
          src="https://cdn.omise.co/omise.js"
          strategy="beforeInteractive"
        />
      )}
      <NavBar />

      <main aria-label="Payment method">
        {/* Mobile: vertical stack */}
        <div className="flex flex-col gap-5 lg:hidden">
          {summaryCard}
          {methodSelector}
          {paymentForm}
        </div>

        {/* Desktop: 2-column layout */}
        <div className="hidden lg:flex lg:flex-row lg:gap-[22px] lg:px-[256px] lg:py-20">
          <div className="sticky top-28 flex flex-col gap-6 lg:min-w-[400px] lg:max-w-[400px] shrink-0">
            {summaryCard}
            {methodSelector}
          </div>
          <section className="flex-1 min-w-0 rounded-[24px] border border-gray-400 bg-white shadow-sm overflow-hidden min-h-[554px]">
            {paymentForm}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
