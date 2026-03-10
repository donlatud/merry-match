import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { PaymentSuccessContent } from "@/components/payment/PaymentSuccessContent";
import { getIconVariant, parseFeaturesParam } from "@/lib/paymentHelpers";

/**
 * Payment Success (Payment2) – แสดงหลังชำระเงินสำเร็จ
 * Mobile: คอลัมน์เดียว | Desktop: สองคอลัมน์ (ซ้าย: ข้อความ+ปุ่ม, ขวา: การ์ดแพ็กเกจ)
 * รับข้อมูลจาก query: packageName, amount, startDate, nextBillingDate, features (optional JSON)
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
  } = router.query;

  const defaultFeatures = [
    "'Merry' more than a daily limited",
    "Up to 50 Merry per day",
  ];
  const features = parseFeaturesParam(featuresParam, defaultFeatures);
  const iconVariant = getIconVariant(packageName);

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
        iconVariant={iconVariant}
        onBackToHome={handleBackToHome}
        onCheckMembership={handleCheckMembership}
      />
      <Footer />
    </>
  );
}
