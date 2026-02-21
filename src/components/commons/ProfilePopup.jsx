import { useState, useEffect } from "react";
import { mockProfiles } from "./mockProfile";
import { ButtonMerry } from "./button/IconButton";
import { PaginationWrapper } from "../ui/PaginationWrapper";

/**
 * ProfilePopup – Modal แสดงโปรไฟล์ (รูป, ชื่อ, รายละเอียด, Like/Pass)
 *
 * วิธีใช้ (Usage):
 * 1. ส่ง props open (boolean) เปิด/ปิด popup, onClose (function) เรียกเมื่อปิด, id (string|number) id ของโปรไฟล์ใน mock
 * 2. ตัวอย่าง: <ProfilePopup open={isOpen} onClose={() => setIsOpen(false)} id={1} />
 * 3. กด overlay หรือไอคอนกลับ (มือถือ) เพื่อปิด
 * 4. ชื่อยาว: คลิกชื่อเพื่อสลับแสดงแบบย่อ/เต็ม (มือถือ 7 ตัว, จอใหญ่ 12 ตัว แล้ว ...)
 * 5. เลื่อนรูป: ใช้ปุ่มลูกศรในแถบ pagination ด้านล่างรูป
 */
export function ProfilePopup({ open = false, onClose, id }) {
  // ---------- ข้อมูลโปรไฟล์: หาจาก mock ตาม id ----------
  const user = mockProfiles.find((profile) => profile.id === String(id));
  const images = user?.images ?? [];

  // ---------- State: index รูปปัจจุบัน, แสดงชื่อเต็มหรือย่อ, ว่าเป็นจอ lg หรือไม่ ----------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullName, setShowFullName] = useState(false);
  const [isLg, setIsLg] = useState(false);

  // ---------- ตรวจจับ breakpoint lg (1024px) สำหรับการย่อชื่อ ----------
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsLg(e.matches);
    setIsLg(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // ---------- รูปที่แสดง: เลือกจาก images ตาม currentIndex ----------
  const total = images.length;
  const imageUrl = images[currentIndex % Math.max(1, total)];

  // ---------- Logic ชื่อ: ย่อตามจอ (mobile 7 ตัว, lg 12 ตัว) + แบ่ง 2 บรรทัดเมื่อขยายและยาวเกิน 12 ----------
  const truncateLen = isLg ? 12 : 7;
  const isLongName = isLg ? user.name.length > 12 : user.name.length > 10;
  const displayName = showFullName || !isLongName ? user.name : `${user.name.slice(0, truncateLen)}...`;
  const fullNameOver12 = user.name.length > 12;
  const getTwoLines = (name) => {
    if (name.length <= 12) return { line1: name, line2: "" };
    const mid = Math.ceil(name.length / 2);
    const spaceAt = name.indexOf(" ", mid - 3);
    const splitAt = spaceAt >= 0 ? spaceAt + 1 : Math.min(12, name.length);
    return {
      line1: name.slice(0, splitAt).trim(),
      line2: name.slice(splitAt).trim(),
    };
  };
  const { line1: fullNameLine1, line2: fullNameLine2 } = fullNameOver12 ? getTwoLines(user.name) : { line1: user.name, line2: "" };

  // ---------- ฟังก์ชันเลื่อนรูป: ก่อนหน้า / ถัดไป (วนเป็นวงกลม) ----------
  const goPrev = () => setCurrentIndex((i) => (i - 1 + total) % Math.max(1, total));
  const goNext = () => setCurrentIndex((i) => (i + 1) % Math.max(1, total));

  if (!open) return null;

  return (
    <div>
      {/* ========== ชั้น overlay: เต็มจอ, backdrop มัว, scroll ได้, จัดกลาง (มือถือมี pt เพื่อไม่ทับ header) ========== */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/20 pt-[150px] lg:pt-0"
        aria-modal="true"
        role="dialog"
        aria-labelledby="profile-heading"
      >
        {/* ปุ่มโปร่งเต็มจอ: กดที่พื้นหลังเพื่อปิด modal */}
        <button
          type="button"
          className="absolute inset-0 -z-10"
          aria-label="ปิด"
          onClick={onClose}
        />

        {/* การ์ดหลัก: มือถือเต็มความกว้าง + scroll, desktop ขนาดคงที่ 1140x740 มี padding ========== */}
        <article className="relative lg:flex w-full pt-[150px] lg:gap-1 lg:rounded-[32px] bg-white lg:w-[1140px] lg:h-[740px] lg:p-16 overflow-y-auto  shadow-lg">
          {/* ---------- โซนซ้าย: บล็อกรูปโปรไฟล์ + แถบ pagination ---------- */}
          <div>
            {/* บล็อกรูป: แสดงรูปตาม currentIndex, ปุ่ม Like/Pass กลางรูป, ไอคอนกลับ (แสดงแค่มือถือ) */}
            <div className="relative lg:w-[478px] lg:h-[478px]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${user?.name ?? "Profile"} ภาพที่ ${currentIndex + 1}`}
                  className="h-[315px] w-full lg:h-[478px] object-cover rounded-b-4xl lg:rounded-t-4xl"
                  loading="lazy"
                  draggable={false}
                />
              ) : null}

              <div className="absolute left-1/2 top-73 lg:top-113 -translate-x-1/2 flex gap-6">
                <ButtonMerry className="w-15 h-15" />
                <ButtonMerry className="w-15 h-15" />
              </div>
              <img src="/merry_icon/arrow-back.svg" alt="" className="absolute lg:hidden left-0 top-0 " />
            </div>

            {/* แถบ pagination: แสดงเลขตำแหน่ง (เช่น 1/4) + ปุ่มลูกศรก่อนหน้า/ถัดไป */}
            <div>
              <PaginationWrapper
                className="flex h-12 w-full max-w-[375px] items-center justify-between px-8 text-[16px] font-medium"
                total={total}
                currentIndex={currentIndex}
                onPrev={goPrev}
                onNext={goNext}
                prevIcon={<img src="/merry_icon/arrow.svg" alt="" width={48} height={48} className="text-gray-600" />}
                nextIcon={<img src="/merry_icon/arrow.svg" alt="" width={48} height={48} className="rotate-180 text-gray-600" />}
              />
            </div>
          </div>

          {/* ---------- โซนขวา: หัวโปรไฟล์ (ชื่อ, อายุ, สถานที่) + รายละเอียดเต็ม ---------- */}
          <section className="px-4 lg:pl-15 py-6 lg:pb-16" aria-labelledby="profile-heading">
            {/* หัว: ชื่อ (คลิกเพื่อสลับย่อ/เต็ม), อายุ, ไอคอน location + สถานที่ */}
            <header>
              <div className="flex items-center gap-4">
                <h1
                  id="profile-heading"
                  onClick={() => setShowFullName((prev) => !prev)}
                  className={`cursor-pointer text-gray-900 font-extrabold ${showFullName && ((fullNameOver12 && fullNameLine2) || isLongName)
                      ? "text-headline4 leading-tight max-w-[220px]"
                      : "text-headline2 whitespace-nowrap"
                    }`}
                  title="Click to toggle full name"
                >
                  {fullNameOver12 && (showFullName || !isLongName) && fullNameLine2 ? (
                    <>
                      {fullNameLine1}
                      <br />
                      {fullNameLine2}
                    </>
                  ) : (
                    displayName
                  )}
                </h1>
                <p className="text-headline2 text-gray-700 font-extrabold">{user.age}</p>
              </div>
              <div className="flex gap-4">
                <img src="/merry_icon/icon-match-log.svg" alt="" width={24} height={24} />
                <p className="text-body1 font-semibold text-gray-700">{user.location}</p>
              </div>
            </header>

            {/* ---------- บล็อกรายละเอียด: ตาราง attributes, About me, แท็ก Hobbies ---------- */}
            <div className="mt-6 space-y-6">
              {/* ตาราง attributes: Sexual identities, Sexual preferences, Racial preferences, Meeting interests */}
              <section aria-labelledby="attributes-heading">
                <h2 id="attributes-heading" className="sr-only">Attributes</h2>
                <dl className="grid grid-cols-[auto_1fr] grid-rows-4 items-center gap-x-4 gap-y-3 text-body2 font-medium">
                  <dt className="text-gray-900">Sexual identities</dt>
                  <dd className="min-w-0 font-semibold">{user.sexualIdentity}</dd>
                  <dt className="text-gray-900">Sexual preferences</dt>
                  <dd className="min-w-0 font-semibold">{user.sexualPreference}</dd>
                  <dt className="text-gray-900">Racial preferences</dt>
                  <dd className="min-w-0 font-semibold">{user.racialPreference}</dd>
                  <dt className="text-gray-900">Meeting interests</dt>
                  <dd className="min-w-0 font-semibold">{user.meetingInterest}</dd>
                </dl>
              </section>

              {/* ข้อความ About me (คำอธิบายสั้นๆ ของ user) */}
              <section aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-headline4 font-bold text-gray-900">About me</h2>
                <p className="mt-2 lg:w-full font-medium text-gray-900">{user.about}</p>
              </section>

              {/* แท็ก Hobbies and Interests: แสดงเป็น pill แต่ละอัน */}
              <section aria-labelledby="hobbies-heading">
                <h2 id="hobbies-heading" className="text-headline4 font-bold text-gray-900">Hobbies and Interests</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.interests?.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-2xl border border-purple-300 px-4 py-2 text-body2 font-medium text-purple-600"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
