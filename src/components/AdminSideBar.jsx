import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/login/useAuth";
import { useRouter } from "next/router";

const adminMenu = [
  {
    to: "/admin/merry-package",
    icon: "/merry_icon/icon-merry-package.svg",
    label: "Merry Package",
  },
  {
    to: "/admin/complaint",
    icon: "/merry_icon/icon-complaint.svg",
    label: "Complaint",
  },
];

const menuClass = "flex items-center gap-3 px-4 py-2 rounded text-sm";

function AdminSideBar() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout(); // ล้าง auth state + localStorage
    router.push("/"); // กลับหน้าแรก
  };

  return (
    <aside className=" max-w-[16.75vw] bg-white min-h-screen flex flex-col border-r gap-10">
      {/* Logo */}
      <div className="mb-10 p-6 flex flex-col  items-center">
        <Link href="/" className="font-bold text-2xl">
          <Image
            src="/merry_icon/logo-merry-match.svg"
            alt="Merry Macth"
            width={187}
            height={63}
          />
        </Link>
        <div className="text-body2 text-gray-700">Admin Panel control</div>
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        {adminMenu.map((item) => (
          <Link
            href={item.to}
            key={item.to}
            className={`${menuClass} ${
              router.pathname === `${item.to}`
                ? "bg-gray-200 text-black font-medium shadow-sm py-6"
                : "text-gray-600 hover:bg-white/60 py-6"
            }`}
          >
            {" "}
            {/* icon */}
            <Image
              src={item.icon}
              alt={item.label}
              width={24}
              height={24}
              className=" object-contain"
            />
            <span className="text-body3 text-gray-800 font-extrabold">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto my-15 pb-30 ">
        <hr />
        <button
          className=" px-6 py-6 flex gap-2 cursor-pointer"
          onClick={handleLogout}
        >
          <svg
            width={18}
            height={16}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-red-200 inline-block"
          >
            <path
              d="M19.5 23.9996V25.4996C19.5 26.6931 19.0259 27.8377 18.182 28.6816C17.3381 29.5255 16.1935 29.9996 15 29.9996H9C7.80653 29.9996 6.66193 29.5255 5.81802 28.6816C4.97411 27.8377 4.5 26.6931 4.5 25.4996V10.4996C4.5 9.30616 4.97411 8.16157 5.81802 7.31765C6.66193 6.47374 7.80653 5.99963 9 5.99963H15C16.1935 5.99963 17.3381 6.47374 18.182 7.31765C19.0259 8.16157 19.5 9.30616 19.5 10.4996V11.9996M25.5 23.9996L31.5 17.9996L25.5 23.9996ZM31.5 17.9996L25.5 11.9996L31.5 17.9996ZM31.5 17.9996H10.5H31.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>{" "}
          {/* เปลี่ยนสี icon */}
          <span className="text-body3 text-gray-800 font-extrabold">
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSideBar;
