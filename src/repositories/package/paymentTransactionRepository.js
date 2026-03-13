import { prisma } from "@/lib/prisma";
import { PaymentTransactionStatus } from "@prisma/client";

/**
 * หา PaymentTransaction จาก external charge id (Omise charge id)
 */
export async function findTransactionByExternalChargeId(externalChargeId) {
  if (!externalChargeId) return null;
  return prisma.paymentTransaction.findUnique({
    where: { external_charge_id: String(externalChargeId) },
    include: { user_subscription: true },
  });
}

/**
 * สร้างหรืออัปเดต PaymentTransaction จาก webhook (charge id เป็น unique key)
 * - ถ้ามีแล้ว: อัปเดต status + paid_at (+ package_id ถ้าส่งมา และ record ยังไม่มี — กรณี recurring)
 * - ถ้าไม่มี: สร้างใหม่ (ต้องมี subscription แล้ว) พร้อม package_id ถ้ามี (ใช้แสดง billing history)
 *
 * @param {Object} params
 * @param {number} [params.packageId] - id แพ็ก ณ ตอน charge (จาก metadata หรือ subscription)
 */
export async function upsertTransactionFromWebhook({
  userSubscriptionId,
  externalChargeId,
  amount,
  currency,
  gateway,
  status,
  paidAt,
  packageId,
}) {
  if (!externalChargeId) {
    const err = new Error("MISSING_EXTERNAL_CHARGE_ID");
    err.statusCode = 400;
    throw err;
  }
  const amountDecimal = typeof amount === "number" ? amount.toFixed(2) : String(amount ?? "0");
  const data = {
    user_subscription_id: userSubscriptionId,
    amount: amountDecimal,
    currency: currency || "THB",
    gateway: gateway || "omise",
    external_charge_id: externalChargeId ? String(externalChargeId) : null,
    status: status || PaymentTransactionStatus.PENDING,
    paid_at: paidAt ?? null,
    // package_id: แพ็ก ณ ตอนจ่าย — ใช้แสดง billing history; ถ้าไม่มีจะเป็น null (ข้อมูลเก่า)
    ...(packageId != null ? { package_id: packageId } : {}),
  };

  const existing = await prisma.paymentTransaction.findUnique({
    where: { external_charge_id: String(externalChargeId) },
  });

  if (existing) {
    const updateData = {
      status: data.status,
      paid_at: data.paid_at,
      // กรณี recurring: transaction อาจถูกสร้างจาก Omise โดยไม่มี package_id — เติมเมื่อ webhook มีค่า
      ...(packageId != null ? { package_id: packageId } : {}),
    };
    return prisma.paymentTransaction.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  return prisma.paymentTransaction.create({
    data,
  });
}
