import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { PaymentSuccessContent } from "@/components/payment/PaymentSuccessContent";
import { parseFeaturesParam } from "@/lib/paymentHelpers";

/**
 * Payment Success (Payment2) – แสดงหลังชำระเงินสำเร็จ
 * Mobile: คอลัมน์เดียว | Desktop: สองคอลัมน์ (ซ้าย: ข้อความ+ปุ่ม, ขวา: การ์ดแพ็กเกจ)
 * รับข้อมูลจาก query: packageName, amount, startDate, nextBillingDate, features (optional JSON), iconUrl (จาก checkout)
 */
export default function PaymentSuccessPage() {
  const router = useRouter();
  const {
    packageName = "Premium",
    amount = "149.00",
    currency = "THB",
    startDate,
    nextBillingDate,
    features: featuresParam,
    iconUrl,
  } = router.query;

  const defaultFeatures = [
    "'Merry' more than a daily limited",
    "Up to 50 Merry per day",
  ];
  const features = parseFeaturesParam(featuresParam, defaultFeatures);
  const iconUrlResolved = typeof iconUrl === "string" ? iconUrl : null;

  const handleBackToHome = () => router.push("/");
  const handleCheckMembership = () => router.push("/membership");

  return (
    <>
      <NavBar />
      <PaymentSuccessContent
        packageName={packageName}
        amount={amount}
        currency={currency}
        startDate={startDate ?? new Date().toISOString()}
        nextBillingDate={
          nextBillingDate ??
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
        features={features}
        iconUrl={iconUrlResolved}
        onBackToHome={handleBackToHome}
        onCheckMembership={handleCheckMembership}
      />
      <Footer />
    </>
  );
}
