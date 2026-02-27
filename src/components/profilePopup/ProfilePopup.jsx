import { useState, useEffect } from "react";
import axios from "axios";
import { ButtonMerry, ButtonPass } from "../commons/button/IconButton";
import { PaginationWrapper } from "../ui/PaginationWrapper";

/**
 * ProfilePopup – Modal แสดงโปรไฟล์ (รูป, ชื่อ, รายละเอียด, ปุ่ม Like/Pass)
 *
 * วิธีใช้งาน (Usage)
 * -----------------
 * Props:
 *   - open (boolean)     เปิด/ปิด popup (default: true)
 *   - onClose (function) เรียกเมื่อผู้ใช้ปิด popup (กด overlay / ปุ่มปิด / ไอคอนกลับ)
 *   - id (string)        id ของ profile ในระบบ ใช้ดึงข้อมูลจาก GET /api/profile/[id]
 *   - leftButton (node)  ปุ่มซ้าย (ไม่ส่งจะใช้ ButtonPass)
 *   - rightButton (node) ปุ่มขวา (ไม่ส่งจะใช้ ButtonMerry)
 *
 * ตัวอย่าง:
 *   const [isOpen, setIsOpen] = useState(false);
 *   const [selectedId, setSelectedId] = useState(null);
 *   <ProfilePopup open={isOpen} onClose={() => setIsOpen(false)} id={selectedId} />
 *
 * พฤติกรรม:
 *   - เปิด popup เมื่อ open=true และมี id จะ fetch ข้อมูลจาก API ทันที
 *   - ปิด: กด overlay, ปุ่ม X (desktop), หรือไอคอนกลับ (มือถือ)
 *   - ชื่อยาว: คลิกชื่อเพื่อสลับแสดงแบบย่อ/เต็ม (มือถือ 10 ตัว, desktop 12 ตัว แล้ว ...)
 *   - เลื่อนรูป: ใช้ปุ่มลูกศรในแถบ pagination ด้านล่างรูป (วนเป็นวงกลม)
 */
export function ProfilePopup({
  open = true,
  onClose,
  id,
  leftButton,
  rightButton,
}) {
  // ---------- State: ข้อมูลโปรไฟล์, สถานะโหลด, ข้อความ error ----------
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // ---------- ดึงข้อมูลโปรไฟล์ตาม id จาก API (ไม่แนบ token) ----------
  useEffect(() => {
    if (!open || !id) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/profile/${id}`);
        const data = res.data;

        if (!data) {
          setError("ไม่พบข้อมูลโปรไฟล์");
          setUser(null);
          return;
        }

        setUser({
          ...data,
          images: data.images ?? [],
        });
      } catch (err) {
        console.error("Failed to load profile in popup:", err);
        setError(
          err.response?.data?.error || err.message || "โหลดโปรไฟล์ไม่สำเร็จ"
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open, id]);

  // ---------- รูปที่แสดง: เลือกจาก images ตาม currentIndex ----------
  const total = images.length;
  const imageUrl = images[currentIndex % Math.max(1, total)];

  // ---------- Logic ชื่อ: ย่อตามจอ (mobile 10 ตัว, lg 12 ตัว) + แบ่ง 2 บรรทัดเมื่อขยายและยาวเกิน 12 ----------
  const name = user?.name ?? "";
  const truncateLen = isLg ? 12 : 10;
  const isLongName = isLg ? name.length > 12 : name.length > 10;
  const displayName =
    showFullName || !isLongName ? name : `${name.slice(0, truncateLen)}...`;
  const fullNameOver12 = name.length > 12;
  const getTwoLines = (value) => {
    if (value.length <= 12) return { line1: value, line2: "" };
    const mid = Math.ceil(value.length / 2);
    const spaceAt = value.indexOf(" ", mid - 3);
    const splitAt = spaceAt >= 0 ? spaceAt + 1 : Math.min(12, value.length);
    return {
      line1: value.slice(0, splitAt).trim(),
      line2: value.slice(splitAt).trim(),
    };
  };
  const { line1: fullNameLine1, line2: fullNameLine2 } = fullNameOver12
    ? getTwoLines(name)
    : { line1: name, line2: "" };

  // ---------- ฟังก์ชันเลื่อนรูป: ก่อนหน้า / ถัดไป (วนเป็นวงกลม) ----------
  const goPrev = () =>
    setCurrentIndex((i) => (i - 1 + total) % Math.max(1, total));
  const goNext = () =>
    setCurrentIndex((i) => (i + 1) % Math.max(1, total));

  // ---------- Early return: ยังไม่เปิด popup ไม่ render อะไร ----------
  if (!open) return null;

  // ---------- Early return: ยังไม่มี user (กำลังโหลด / error) แสดงกล่องข้อความกลางจอ ----------
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
        <div className="rounded-xl bg-white px-6 py-4 text-body2 shadow">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : loading ? (
            "กำลังโหลดโปรไฟล์..."
          ) : (
            "ไม่พบข้อมูลโปรไฟล์"
          )}
        </div>
      </div>
    );
  }

  // ---------- Render หลัก: Modal การ์ดโปรไฟล์ ----------
  return (
    <div className="fixed">
      {/* Overlay: เต็มจอ, backdrop มัว, scroll ได้, จัดกลาง (มือถือ pt-[50px] เพื่อไม่ทับ header) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/20 pt-[50px] lg:pt-0"
        aria-modal="true"
        role="dialog"
        aria-labelledby="profile-heading"
      >
        {/* ปุ่มโปร่งเต็มจอ: กดพื้นหลังปิด modal (ต้องกดบน overlay ไม่ใช่บนการ์ด) */}
        <button
          type="button"
          className="absolute inset-0 -z-10"
          aria-label="ปิด"
          onClick={onClose}
        />

        {/* การ์ดหลัก: มือถือเต็มกว้าง+scroll, desktop 1140px กว้าง มี padding lg:p-16 */}
        <article className="relative lg:flex w-full h-full lg:gap-1 lg:rounded-[32px] bg-white lg:w-[1140px] lg:h-fit lg:p-16 overflow-y-auto  shadow-lg">
          {/* ปุ่มปิด (แสดงเฉพาะ lg): มุมขวาบน */}
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="hidden lg:flex absolute top-4 right-4 z-20 w-9 h-9 items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <img src="/merry_icon/icon-close.svg" alt="" width={36} height={36} />
          </button>
          {/* โซนซ้าย: บล็อกรูปโปรไฟล์ + แถบ pagination + ปุ่ม Like/Pass + ไอคอนกลับ (มือถือ) */}
          <div>
            {/* บล็อกรูป: แสดงรูปที่ currentIndex, ขนาดมือถือ 315px สูง / desktop 478x478 */}
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

              {/* ปุ่ม Like (ขวา) / Pass (ซ้าย): กลางรูป หรือใช้ leftButton/rightButton ที่ส่งมา */}
              <div className="absolute z-10 left-1/2 top-71 lg:top-112 -translate-x-1/2 flex gap-6 ">
                {leftButton ?? (
                  <ButtonPass
                    className="w-15 h-15 disabled:opacity-40 disabled:cursor-not-allowed [&_img]:w-10 [&_img]:h-10 shadow-button"
                    onClick={() => alert("left button clicked")}
                  />
                )}
                {rightButton ?? (
                  <ButtonMerry
                    className="w-15 h-15 disabled:opacity-40 disabled:cursor-not-allowed [&_img]:w-12 [&_img]:h-10 shadow-button"
                    onClick={() => alert("right button clicked")}
                  />
                )}
              </div>

              {/* แถบ pagination: แสดงตำแหน่งรูป (เช่น 1/4) + ปุ่มลูกศรก่อนหน้า/ถัดไป วนเป็นวงกลม */}
              <div className="absolute w-full z-0">
                <PaginationWrapper
                  className="flex h-12 w-full max-w-[375px]  items-center justify-between px-8 text-body2 font-medium"
                  total={total}
                  currentIndex={currentIndex}
                  onPrev={goPrev}
                  onNext={goNext}
                  prevIcon={
                    <img
                      src="/merry_icon/arrow.svg"
                      alt=""
                      width={48}
                      height={48}
                      className="text-gray-600"
                    />
                  }
                  nextIcon={
                    <img
                      src="/merry_icon/arrow.svg"
                      alt=""
                      width={48}
                      height={48}
                      className="rotate-180 text-gray-600"
                    />
                  }
                />
              </div>

              {/* ปุ่มกลับ: แสดงเฉพาะมือถือ (lg:hidden) กดปิด popup */}
              <button
                type="button"
                aria-label="ปิดโปรไฟล์"
                onClick={onClose}
                className="left-0 absolute top-1 z-20 lg:hidden w-12 h-12 flex items-center justify-center rounded-br-xl"
              >
                <img src="/merry_icon/arrow-back.svg" alt="" />
              </button>
            </div>
          </div>

          {/* โซนขวา: หัวโปรไฟล์ (ชื่อคลิกสลับย่อ/เต็ม, อายุ, สถานที่) + attributes, About me, Hobbies */}
          <section className="px-4 pt-12 lg:pt-0 lg:pl-15 py-6 lg:pb-16" aria-labelledby="profile-heading">
            {/* Header: ชื่อ (คลิกสลับย่อ/เต็ม), อายุ, ไอคอน location + สถานที่ */}
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
                <img src="/merry_icon/icon-location-popup.svg" alt="" width={24} height={24} />
                <p className="text-body1 font-semibold text-gray-700">{user.location}</p>
              </div>
            </header>

            {/* บล็อกรายละเอียด: ตาราง attributes + About me + Hobbies */}
            <div className="mt-6 space-y-6">
              {/* ตาราง attributes: Sexual identities, Sexual preferences, Racial preferences, Meeting interests */}
              <section aria-labelledby="attributes-heading">
                <h2 id="attributes-heading" className="sr-only">Attributes</h2>
                <dl className="grid grid-cols-[auto_1fr] grid-rows-4 gap-x-4 gap-y-3 text-body2 font-medium text-left">
                  <dt className="text-gray-900 text-left">Sexual identities</dt>
                  <dd className="min-w-0 font-semibold text-gray-700 text-left">{user.sexualIdentity}</dd>
                  <dt className="text-gray-900 text-left">Sexual preferences</dt>
                  <dd className="min-w-0 font-semibold text-gray-700 text-left">{user.sexualPreference}</dd>
                  <dt className="text-gray-900 text-left">Racial preferences</dt>
                  <dd className="min-w-0 font-semibold text-gray-700 text-left">{user.racialPreference}</dd>
                  <dt className="text-gray-900 text-left">Meeting interests</dt>
                  <dd className="min-w-0 font-semibold text-gray-700 text-left">{user.meetingInterest}</dd>
                </dl>
              </section>

              {/* About me: คำอธิบายสั้นๆ ของ user (ไม่มีแสดง "-") */}
              <section aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-headline4 font-bold text-gray-900 text-left">About me</h2>
                <p className="mt-2 lg:w-full font-medium text-gray-900 text-left">{user.about || "-"}</p>
              </section>

              {/* Hobbies and Interests: แสดงเป็น pill (border purple) จาก user.interests */}
              <section aria-labelledby="hobbies-heading" className="text-left">
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
