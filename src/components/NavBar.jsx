import Link from "next/link";
import { useRouter } from "next/router";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { useAuth } from "@/hooks/login/useAuth";
import MemberNavBar from "@/components/MemberNavBar";

const SCROLL_OFFSET_PX = 64;

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // เลื่อนไป section ตาม anchor (มาจากหน้าอื่นด้วย hash (/#why-merry-match) เลื่อนไป section)
  const handleAnchorClick = (e) => {
    const href = e.currentTarget.getAttribute("href");
    if (!href?.startsWith("/#")) return;
    const id = href.replace("/#", "");
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      const top =
        el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-0 z-70">
      <nav className="h-13 lg:h-22 border-b bg-utility-white shadow-button">
        <div className="h-full w-full max-w-[1120px] lg:mx-auto px-5 flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // Animate: Dissolve; animation-timing-function: ease-out; animation-duration: 300ms;
              document.body
                .animate([{ opacity: 1 }, { opacity: 0 }], {
                  duration: 300,
                  easing: "ease-out",
                })
                .addEventListener("finish", () => {
                  router.push("/");
                });
            }}
          >
            <img
              src="/merry_icon/logo-merry-match.svg"
              alt="Merry Match"
              className="h-9.5 lg:h-14 w-auto"
            />
          </Link>

          {/* Mobile: ไม่ login = Chat + Notification (ซ่อน) + Hamburger | login = MemberNavBar */}
          {isAuthenticated ? (
            <MemberNavBar onLogout={logout} />
          ) : (
            <>
              <div className="flex items-center gap-5 lg:hidden">
                <div className="flex items-center gap-3">
                  {/* TODO: link to login — ใส่ตรงนี้ */}
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 transition-opacity hover:bg-purple-100 cursor-pointer"
                    aria-label="Chat"
                  >
                    <img
                      src="/merry_icon/icon-chat.svg"
                      alt=""
                      className="w-[14px] h-[14px]"
                    />
                  </Link>
                  <Link
                    href="/notifications"
                    className="invisible pointer-events-none flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 transition-opacity hover:bg-purple-100 cursor-pointer"
                    aria-label="Notifications"
                    aria-hidden
                  >
                    <img
                      src="/merry_icon/icon-notification.svg"
                      alt=""
                      className="w-[14px] h-[14px]"
                    />
                  </Link>
                </div>

                <Link
                  href="/login"
                  className="flex flex-col justify-between w-5 h-4 cursor-pointer"
                >
                  <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
                  <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
                  <span className="block w-full h-0.5 bg-gray-700 rounded-full"></span>
                </Link>
              </div>

              {/* Desktop: Why/How to + Login  */}
              <div className="hidden lg:flex items-center gap-11">
                <Link
                  href="/#why-merry-match"
                  onClick={handleAnchorClick}
                  className="text-body2 text-purple-800 font-bold hover:underline cursor-pointer"
                >
                  Why Merry Match?
                </Link>
                <Link
                  href="/#how-to-merry"
                  onClick={handleAnchorClick}
                  className="text-body2 text-purple-800 font-bold hover:underline cursor-pointer"
                >
                  How to Merry
                </Link>
                <PrimaryButton
                  className="w-auto min-w-0 text-body2! font-bold cursor-pointer"
                  asChild
                >
                  {/* TODO: link to login — ใส่ตรงนี้ */}
                  <Link href="/login">Login</Link>
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
