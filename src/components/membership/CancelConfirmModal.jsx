"use client";

import Modal from "@/components/commons/modal/modal";

/**
 * Modal ยืนยันการยกเลิก Merry Membership
 * layout และการแสดงผลเหมือนเดิม — แยกจากหน้า membership เพื่อลดความยาวไฟล์
 */
export function CancelConfirmModal({
  open,
  onClose,
  onLeftClick,
  onRightClick,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel Confirmation"
      message="Do you sure to cancel Merry Membership?"
      leftText="Yes, I want to cancel"
      rightText="No, I still want to be member"
      onLeftClick={onLeftClick}
      onRightClick={onRightClick}
      type="secondary"
    />
  );
}
