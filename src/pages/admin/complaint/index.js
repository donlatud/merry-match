import AdminLayout from "@/components/layouts/AdminLayout";
import InputBar from "@/components/commons/input/InputBar";
import Image from "next/image";
import DropdownBar from "@/components/commons/input/DropDownBar";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { format } from "date-fns";
import { useRouter } from "next/router";

function ComplaintPage() {
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/complaint");
        setItems(res.data);
      } catch (err) {
        console.error("Fetch complaint error:", err);
      }
    }
    console.log("hit");
    fetchData();
  }, []);

  useEffect(() => {
    console.log("items updated:", items);
  }, [items]);

  const statusClasses = {
    new: "bg-beige-100 text-beige-700",
    pending: "bg-yellow-100 text-yellow-500",
    resolved: "bg-[#E7FFE7] text-[#197418]",
    cancelled: "bg-gray-200 text-gray-700",
  };
  const statusLabels = {
    new: "New",
    pending: "Pending",
    resolved: "Resolved",
    cancelled: "Cancelled",
  };

  const filteredItems = items.filter((item) => {
  const matchesSearch =
    item.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.username.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus =
    selected === "" ||
    selected === "All" ||
    item.status === selected;

  return matchesSearch && matchesStatus;
});
  return (
    <>
      <AdminLayout>
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-15 py-4 shrink-0">
            <h4 className="text-headline4 font-bold w-132">Complaint</h4>
            <div className="flex gap-4 items-end">
              <InputBar
                leftIcon={
                  <Image
                    src="/merry_icon/icon-search.svg"
                    width={24}
                    height={24}
                    alt="search-icon"
                  />
                }
                className="w-[320px]"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <DropdownBar
                options={["All", "new", "pending", "resolved", "cancelled"]}
                value={selected}
                onChange={setSelected}
                className="w-50"
                placeholder="All status"
                option
              />
            </div>
            <div className="flex gap-4"></div>
          </div>

          <hr className="shrink-0" />

          {/* Gray area */}
          <div className="flex-1 bg-gray-100 flex py-20 justify-center">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <table className="w-270 max-w-full text-sm">
                <thead className="bg-gray-200 text-gray-600">
                  <tr>
                    <th className="py-2.5 px-10 text-left text-body4 w-41">
                      User
                    </th>
                    <th className="py-2.5 px-4 text-left text-body4 w-50">
                      Issue
                    </th>
                    <th className="py-2.5 px-4 text-left text-body4 w-12.5">
                      Description
                    </th>
                    <th className="py-2.5 px-4 text-left text-body4 w-41">
                      Date Submitted
                    </th>
                    <th className="py-2.5 px-4 text-left text-body4 w-33">
                      status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                      <tr
                        className="border-y bg-white hover:bg-gray-50 cursor-pointer transition"
                        key={item.id}
                        onClick={() => router.push(`/complaint/${item.id}`)}
                      >
                        {/* Username */}
                        <td className="py-2.5 px-10 text-body2">
                          {item.user.username}
                        </td>
                        {/* Issue */}
                        <td className="px-4 py-8 text-body2">
                          {item.issue.length > 100
                            ? item.issue.slice(0, 22) + "..."
                            : item.issue}
                        </td>
                        {/* Description */}
                        <td className="px-4 py-8 text-body2">
                          {item.description.length > 50
                            ? item.description.slice(0, 50) + "..."
                            : item.description}
                        </td>
                        {/* Submitted date */}
                        <td className="px-4 text-body2">
                          {format(new Date(item.createdAt), "dd/MM/yyyy")}
                        </td>
                        {/* Status */}
                        <td className="text-body2">
                          <div
                            className={`
                            rounded-xl
                            w-fit
                            py-1
                           px-2.5
                           ${statusClasses[item.status]}
                           `}
                          >
                            {statusLabels[item.status]}
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

export default ComplaintPage;
