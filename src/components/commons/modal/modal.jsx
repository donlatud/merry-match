import React from "react";

/**
 * Modal ยืนยันการกระทำ (มีปุ่มซ้าย + ขวา)
 *
 * วิธีใช้
 * ------
 * 1. ใช้ state ควบคุม open/close เช่น useState(false)
 * 2. ส่ง props ตามด้านล่าง
 *
 * Props
 * -----
 * - open (boolean): แสดง/ซ่อน modal
 * - onClose (function): เมื่อกดปิด (×) หรือต้องการปิดจากภายนอก
 * - title (string): หัวข้อ modal
 * - message (string): ข้อความใน modal
 * - leftText (string): ข้อความปุ่มซ้าย
 * - rightText (string): ข้อความปุ่มขวา
 * - onLeftClick (function): เมื่อกดปุ่มซ้าย
 * - onRightClick (function): เมื่อกดปุ่มขวา
 * - type ("primary" | "secondary"): กำหนดว่าปุ่มไหนเป็นปุ่มหลัก (แดงเต็ม)
 *   - "primary" = ปุ่มซ้ายเป็นปุ่มหลัก (แดงเต็ม), ปุ่มขวาเป็นปุ่มรอง (แดงอ่อน)
 *   - "secondary" = ปุ่มขวาเป็นปุ่มหลัก (แดงเต็ม), ปุ่มซ้ายเป็นปุ่มรอง (แดงอ่อน)
 *
 * ตัวอย่าง
 * -------
 * const [open, setOpen] = useState(false);
 *
 * <Modal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="ยกเลิกคำร้อง"
 *   message="คุณต้องการยกเลิกคำร้องนี้หรือไม่?"
 *   leftText="ไม่ยกเลิก"
 *   rightText="ยกเลิก"
 *   onLeftClick={() => setOpen(false)}
 *   onRightClick={() => { doCancel(); setOpen(false); }}
 *   type="secondary"
 * />
 *
 */
const btnSecondary =
  "px-6 py-3 rounded-full bg-red-100 text-red-700 text-body2 font-semibold shadow hover:bg-red-200 transition cursor-pointer";
const btnPrimary =
  "px-6 py-3 rounded-full bg-red-500 text-white text-body2 font-semibold shadow hover:bg-red-600 transition cursor-pointer";

const Modal = ({
  open = false,
  onClose,
  title = "Title",
  message = "Message",
  leftText = "cancel",
  rightText = "keep",
  onLeftClick,
  onRightClick,
  type = "primary",
}) => {
  if (!open) return null;

  const leftIsPrimary = type === "primary";
  const leftClass = leftIsPrimary ? btnPrimary : btnSecondary;
  const rightClass = leftIsPrimary ? btnSecondary : btnPrimary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 shadow-button"
      aria-modal="true"
      role="dialog"
    >
      <div className="min-w-[528px] max-w-full bg-card text-card-foreground rounded-2xl shadow-lg p-0 border border-border">
        <div className="flex justify-between items-center px-6 py-3">
          <div
            className="text-body1 font-semibold text-card-foreground"
            data-testid="modal-title"
          >
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full transition"
            aria-label="Close"
          >
            <img
              src="/merry_icon/icon-close.svg"
              alt=""
              width={24}
              height={24}
              className="size-6 hover:bg-red-100 hover:rounded-full transition cursor-pointer"
            />
          </button>
        </div>
        <hr className="border-border" />
        <div className="p-6">
          <div className="text-muted-foreground mb-7 text-body2">{message}</div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onLeftClick}
              className={leftClass}
              autoFocus
            >
              {leftText}
            </button>
            <button
              type="button"
              onClick={onRightClick}
              className={rightClass}
            >
              {rightText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;