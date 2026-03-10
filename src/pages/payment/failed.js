import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import { PaymentFailedContent } from "@/components/payment/PaymentFailedContent";

/**
 * Payment Failed – แสดงเมื่อชำระเงินไม่สำเร็จ
 * ออกแบบตาม ref: การ์ดกลางจอ (mobile/desktop), ไอคอนเตือนในวงกลม, ข้อความอธิบาย, ปุ่มหลัก (solid) + ลิงก์รอง (text only)
 * ธีม: สีและโทนเดียวกับหน้า payment อื่น (beige-100 การ์ด, red/gray ข้อความ)
 */
export default function PaymentFailedPage() {
  const router = useRouter();
  const { subscriptionId, message } = router.query;

  const handleRetry = () => {
    if (subscriptionId) {
      router.push(`/payment/checkout?subscriptionId=${subscriptionId}`);
    } else {
      router.push("/payment/checkout");
    }
  };

  const handleBackToPackages = () => router.push("/payment");

  const description =
    message && typeof message === "string"
      ? decodeURIComponent(message)
      : "There seems to be an issue with your card. Please check your card details and try again later, or use a different payment method.";

  return (
    <>
      <NavBar />
      <PaymentFailedContent
        description={description}
        onRetry={handleRetry}
        onBackToPackages={handleBackToPackages}
      />
    </>
  );
}
