import { PaymentTransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

/**
 * GET /api/membership/history
 * คืน billing history ของ user ที่ login
 *
 * หมายเหตุ (Phase 1):
 * - ใช้ข้อมูลจาก schema เดิมก่อน
 * - packageName ของรายการย้อนหลังยังอิง package ปัจจุบันของ subscription
 *   จนกว่าจะมี snapshot fields ใน payment_transactions
 */
export default async function handler(req, res) {
  try {
    allowMethods(["GET"])(req, res);
    await authMiddleware(req, res);

    const userId = req.user?.id;
    if (!userId) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    // ดึง profile ของ user ปัจจุบัน แล้วอ่าน subscription ปัจจุบันพร้อม transaction ที่จ่ายสำเร็จ
    // ใน Phase 1 ใช้ความสัมพันธ์เดิมจาก schema ก่อน โดยยังไม่เพิ่ม snapshot fields
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: {
        subscription: {
          select: {
            end_date: true,
            package: {
              select: {
                name: true,
              },
            },
            transactions: {
              where: {
                status: PaymentTransactionStatus.PAID,
              },
              orderBy: {
                created_at: "desc",
              },
              select: {
                id: true,
                amount: true,
                currency: true,
                gateway: true,
                status: true,
                paid_at: true,
                created_at: true,
              },
            },
          },
        },
      },
    });

    const subscription = profile?.subscription;

    // nextBillingDate ใช้ end_date ของ subscription ปัจจุบัน
    const nextBillingDate = subscription?.end_date?.toISOString?.() ?? null;

    // Phase 1: packageName ของ history ใช้ชื่อแพ็กปัจจุบันของ subscription ก่อน
    // ถ้ามี change plan ภายหลัง ชื่อแพ็กย้อนหลังอาจไม่ตรง 100% จนกว่าจะมี snapshot fields
    const packageName = subscription?.package?.name ?? null;

    // map transaction ให้เป็น response shape ที่หน้า /membership ใช้ได้ทันที
    // date: ใช้ paid_at ก่อน ถ้าไม่มีค่อย fallback ไป created_at
    const transactions = Array.isArray(subscription?.transactions)
      ? subscription.transactions.map((transaction) => ({
          id: transaction.id,
          date:
            transaction.paid_at?.toISOString?.() ??
            transaction.created_at?.toISOString?.() ??
            null,
          packageName,
          amount:
            transaction.amount?.toString?.() ??
            String(transaction.amount ?? ""),
          currency: transaction.currency ?? "THB",
          status: transaction.status,
          gateway: transaction.gateway ?? null,
        }))
      : [];

    // คืน next billing + รายการ transaction สำหรับ billing history
    return res.status(200).json({
      nextBillingDate,
      transactions,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
