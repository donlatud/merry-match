/** ค่าเริ่มต้นสำหรับ billing history (ใช้ในหน้า membership) */
export const EMPTY_BILLING_HISTORY = {
  nextBillingDate: null,
  transactions: [],
};

/** แปลงค่าเป็นวันที่แสดง (en-GB) */
export function formatDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB").format(date);
}

/** แปลง status เป็น label (ตัวแรกใหญ่) */
export function formatStatusLabel(status) {
  if (!status) return "-";
  const lower = String(status).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** แปลง billing interval เป็น label */
export function formatIntervalLabel(interval) {
  if (!interval) return "Month";
  const lower = String(interval).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** ข้อความ "today" / "in 1 day" / "in X days" สำหรับวันหมดอายุ membership
 * ใช้ "วันในปฏิทิน" (local date) เพื่อให้วันเดียวกันใน timezone ผู้ใช้แสดง "today"
 */
export function formatExpiresInDays(nextBillingDate) {
  if (!nextBillingDate) return "—";
  const now = new Date();
  const end = new Date(nextBillingDate);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDayStart = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffMs = endDayStart.getTime() - todayStart.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

/**
 * ใช้กับ response จาก GET /api/membership/me (มี expireAt, status)
 * คืน true ถ้า user ยังมีสิทธิ์ใช้แพ็ก (ACTIVE หรือ CANCELLED ที่ยังไม่หมดอายุ)
 *
 * @param {{ expireAt?: string | null; status?: string | null } | null} membershipResponse
 * @param {number} [now] - timestamp ปัจจุบัน (ใช้สำหรับอัปเดตทุกนาทีใน usePackageSelection)
 */
export function hasAccessFromMembershipResponse(membershipResponse, now = Date.now()) {
  if (!membershipResponse?.expireAt) return false;
  const { status } = membershipResponse;
  if (status !== "ACTIVE" && status !== "CANCELLED") return false;
  return new Date(membershipResponse.expireAt).getTime() > now;
}

/**
 * มีสิทธิ์ใช้ package อยู่ = status เป็น ACTIVE หรือ CANCELLED (ยกเลิกแล้วแต่ยังไม่ถึง end_date) และยังไม่หมดอายุ
 * - CANCELLED ใช้เมื่อ user กดยกเลิก (cancel at period end)
 * - EXPIRED ใช้เมื่อ end_date ผ่านไปแล้ว
 */
export function hasActiveMembership(subscription) {
  if (!subscription?.package) return false;
  const status = subscription?.status;
  if (status !== "ACTIVE" && status !== "CANCELLED") return false;
  const endDate = subscription?.end_date;
  if (!endDate) return false;
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  return end.getTime() > Date.now();
}

export function isPremiumMembership(subscription) {
  return Boolean(
    hasActiveMembership(subscription) &&
      String(subscription?.package?.name ?? "").toLowerCase() === "premium",
  );
}
