import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PackageForm from "@/components/merry-package/PackageForm";
import AdminLayout from "@/components/layouts/AdminLayout";

export default function EditPackage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchPackage() {
      try {
        const res = await fetch(`/api/admin/merry-package/${id}`);
        if (!res.ok) throw new Error("Failed to fetch package");

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPackage();
  }, [id]);

  async function handleUpdate(updatedData) {
    try {
      const res = await fetch(`/api/admin/merry-package/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Failed to update package");

      router.push("/admin/merry-package");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/admin/merry-package/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to delete package");
      router.push("/admin/merry-package");
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return null; // หรือใส่ spinner ก็ได้
  if (!data) return null;

  return (
    <AdminLayout>
      <PackageForm
        title={`Edit ‘${data.name}’`}
        submitLabel="Update"
        initialData={data}
        onSubmit={handleUpdate}
        onCancel={() => router.push("/admin/merry-package")}
        deletePackage={() => handleDelete(id)}
      />
    </AdminLayout>
  );
}
