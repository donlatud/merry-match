// components/layouts/AdminLayout.jsx
import AdminSideBar from "../AdminSideBar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <div className="w-[240px]">
        <AdminSideBar />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}