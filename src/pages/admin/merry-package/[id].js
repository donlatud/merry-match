import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PackageForm from "@/components/merry-package/PackageForm";
import AdminLayout from "@/components/layouts/AdminLayout";
import { merryToast } from "@/components/commons/toast/MerryToast";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Loading } from "@/components/commons/Loading/Loading";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

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
      merryToast.success("Success", "Updated package successfully",
      <CheckCircleIcon className="size-10! text-green-500" />);
      router.push("/admin/merry-package");
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Something went wrong";

      merryToast.error(
        "Error",
        msg,
        <ExclamationCircleIcon className="size-10! text-red-400" />,
      );
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/admin/merry-package/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to delete package");
      merryToast.success("Success", "Package deleted successfully",
      <CheckCircleIcon className="size-10! text-green-500" />);
      setTimeout(() => {
        router.push("/admin/merry-package");
      }, 2000);
    } catch (err) {
      const msg = err?.message || "Something went wrong";

      merryToast.error(
        "Error!",
        msg,
        <ExclamationCircleIcon className="size-10! text-red-400" />,
      );
    }
  }

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
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
