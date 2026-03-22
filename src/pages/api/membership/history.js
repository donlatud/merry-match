import { PaymentTransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

/**
 * GET /api/membership/history
 * คืน billing history ของ user ที่ login
 *
 * ดึง package name ต่อรายการจาก relation payment_transactions.package_id → packages
 * - ถ้า transaction มี package_id จะใช้ชื่อจาก package นั้น (ถูกต้องตามประวัติ)
 * - ถ้าไม่มี (ข้อมูลเก่า) ใช้ชื่อแพ็กปัจจุบันของ subscription เป็น fallback
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

    // ดึง subscription ปัจจุบัน + transactions ที่จ่ายสำเร็จ พร้อม relation package (สำหรับ package_id ที่มี)
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: {
        subscription: {
          select: {
            end_date: true,
            package: {
              select: { name: true },
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
                package_id: true,
                package: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const subscription = profile?.subscription;

    // nextBillingDate ใช้ end_date ของ subscription ปัจจุบัน
    const nextBillingDate = subscription?.end_date?.toISOString?.() ?? null;

    // ชื่อแพ็กของ subscription ปัจจุบัน — ใช้เป็น fallback เมื่อ transaction ยังไม่มี package_id (ข้อมูลเก่า)
    const subscriptionPackageName = subscription?.package?.name ?? null;

    // map transaction → shape ที่หน้า /membership ใช้ (date, packageName, amount, currency, status)
    // packageName: จาก transaction.package (Phase 2) ถ้ามี package_id ไม่ก็ใช้ subscription package name
    const transactions = Array.isArray(subscription?.transactions)
      ? subscription.transactions.map((transaction) => ({
          id: transaction.id,
          date:
            transaction.paid_at?.toISOString?.() ??
            transaction.created_at?.toISOString?.() ??
            null,
          packageName:
            transaction.package?.name ?? subscriptionPackageName ?? null,
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
