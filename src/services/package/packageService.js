import { getActivePackages as getActivePackagesFromRepo } from "@/repositories/package/packageRepository";

/**
 * คืนรายการ Merry Packages ที่ active สำหรับแสดงบนหน้าเลือกแพ็กเกจ
 * @returns {Promise<import('@prisma/client').Package[]>}
 */
export async function getActivePackages() {
  return getActivePackagesFromRepo();
}

