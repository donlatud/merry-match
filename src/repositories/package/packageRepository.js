import { prisma } from "@/lib/prisma";

/**
 * ดึงรายการแพ็กเกจที่เปิดใช้งานและซื้อได้ (สำหรับแสดงในการ์ดเลือกแพ็ก) — ไม่รวม Free
 * @returns {Promise<import('@prisma/client').Package[]>}
 */
export async function getActivePackages() {
  return prisma.package.findMany({
    where: {
      is_active: true,
      price: { gt: 0 },
    },
    orderBy: { sort_order: "asc" },
    include: {
      details: {
        orderBy: { position: "asc" },
      },
    },
  });
}

