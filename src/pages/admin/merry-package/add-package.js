import AdminLayout from "@/components/layouts/AdminLayout";
import PackageForm from "@/components/merry-package/PackageForm";
import { useRouter } from "next/router";

export default function AddPackage() {
  const router = useRouter();

  async function handleCreate(data) {
    await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    router.push("/admin/merry-package");
  }

  return (
    <AdminLayout>
      <PackageForm
        title="Add Package"
        submitLabel="Create"
        onSubmit={handleCreate}
        onCancel={() => router.push("/admin/merry-package")}
      />
      </AdminLayout>
  );
}