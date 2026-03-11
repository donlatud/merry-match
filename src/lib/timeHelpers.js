/**
 * คำนวณข้อความเวลาแบบ relative (e.g. "Just now", "5m ago")
 * @param {Date|string|number} value - ค่าเวลา
 * @param {number} nowMs - timestamp ปัจจุบัน (ใช้สำหรับ pure render / tests)
 */
export function formatTimeAgo(value, nowMs = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = Math.max(
    0,
    Math.floor((nowMs - date.getTime()) / 1000),
  );
  if (diffSeconds < 10) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w`;
}
