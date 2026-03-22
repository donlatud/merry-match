import AdminLayout from "@/components/layouts/AdminLayout";
import PackageForm from "@/components/merry-package/PackageForm";
import { useRouter } from "next/router";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { merryToast } from "@/components/commons/toast/MerryToast";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function AddPackage() {
  const router = useRouter();

  async function handleCreate(data) {
    try {
      await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      merryToast.success("Success", "Merry package has been created.",
      <CheckCircleIcon className="size-10! text-green-500" />);
      setTimeout(()=> {router.push("/admin/merry-package");},2000)
    } catch (error) {
      const msg = err?.message || "Something went wrong";

      merryToast.error(
        "Error!",
        msg,
        <ExclamationCircleIcon className="size-10! text-red-400" />,
      );
    }
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
