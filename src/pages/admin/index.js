// pages/admin/index.js

export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/admin/merry-package",
      permanent: false, // false = 307 redirect
    },
  };
}

export default function AdminPage() {
  return null; // ไม่ต้อง render อะไร
}