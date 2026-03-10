"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DndContext, closestCenter } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import AdminLayout from "@/components/layouts/AdminLayout";
import Image from "next/image";
import InputBar from "@/components/commons/input/InputBar";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import Modal from "@/components/commons/modal/modal";
import { Loading } from "@/components/commons/Loading/Loading";

import { CSS } from "@dnd-kit/utilities";

function formatDateTime(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function SortableRow({ item, index, onDelete }) {
  const [open, setOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const router = useRouter();

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t bg-white hover:bg-gray-50"
    >
      {/* Drag Handle */}
      <td className="px-4 py-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab flex items-center"
        >
          <Image
            src="/merry_icon/icon-drag.svg"
            width={18}
            height={18}
            alt="drag"
          />
        </div>
      </td>

      {/* Index */}
      <td className="px-4">{index + 1}</td>

      {/* Icon */}
      <td className="px-4">
        <Image
          src={item.icon || "/merry_icon/default.svg"}
          width={32}
          height={32}
          alt="icon"
        />
      </td>

      <td className="px-4 font-medium">{item.name}</td>
      <td className="px-4">{item.merryLimit} Merry</td>
      <td className="px-4">{formatDateTime(item.createdAt)}</td>
      <td className="px-4">{formatDateTime(item.updatedAt)}</td>

      {/* Action */}
      <td className="px-4">
        <div className="flex gap-4">
          <Image
            src="/merry_icon/icon-delete.svg"
            width={20}
            height={20}
            alt="delete"
            className="cursor-pointer"
            onClick={() => setOpen(true)}
          />
          <Image
            src="/merry_icon/icon-edit.svg"
            width={20}
            height={20}
            alt="edit"
            className="cursor-pointer"
            onClick={() => router.push(`/admin/merry-package/${item.id}`)}
          />
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Delete Confirmation"
          message="Do you sure to delete this Package?"
          leftText="Yes, I want to delete"
          rightText="No, I don't want"
          onLeftClick={async () => {
            await onDelete(item.id);
            setOpen(false);
          }}
          onRightClick={() => {
            setOpen(false);
          }}
          type="primary"
        />
      </td>
    </tr>
  );
}

function MerryPackage() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState([]);

  useEffect(() => {
    try{
    async function fetchData() {
      const res = await fetch("/api/admin/merry-package");
      const data = await res.json();
      setItems(data);
      setLoading(true)
    }
    fetchData();
  }
  catch(error){
    setError(error)
  }
  finally{
    setLoading(false)
  }
  }, []);

  useEffect(() => {
    try{
      console.log("items updated:", items);
      setLoading(true)
    }
    catch(error){
      console.log(error)
    }
    finally{
      setLoading(false)
    }
  }, [items]);

  const filteredItems = items.filter((item) => {
    const keyword = searchTerm.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(keyword) ||
      String(item.merryLimit).includes(keyword) ||
      String(item.price).includes(keyword);

    return matchesSearch;
  });

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);

    setItems(newItems);

    await fetch("/api/admin/merry-package/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: newItems }),
    });
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/admin/merry-package/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete package");

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  }
  console.log(loading)
if (loading) return <AdminLayout><Loading /></AdminLayout>;
  return (
    <AdminLayout>
      <div className="h-screen flex flex-col">
        <div className="h-20 px-15 py-4 flex items-center justify-between gap-4 shrink-0">
          <h4 className="text-headline4 font-bold w-142">Merry Package</h4>
          <div className=" flex gap-4">
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

            <PrimaryButton
              className="w-40 font-bold"
              onClick={() => router.push("/admin/merry-package/add-package")}
            >
              + Add Package
            </PrimaryButton>
          </div>
        </div>

        <hr />

        <div className="flex-1 bg-gray-100 px-15 py-6">
          <div className="bg-white rounded-2xl shadow-sm h-fit w-full overflow-clip">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <table className="w-full text-sm">
                  <thead className="bg-gray-200 text-gray-600">
                    <tr>
                      <th className="px-4 py-4"></th>
                      <th className="px-4 text-left"> </th>
                      <th className="px-4 text-left">Icon</th>
                      <th className="px-4 text-left">Package name</th>
                      <th className="px-4 text-left">Merry limit</th>
                      <th className="px-4 text-left">Created date</th>
                      <th className="px-4 text-left">Updated date</th>
                      <th className="px-4"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.map((item, index) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        index={index}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
            {filteredItems.length === 0 && 
            <div className=" flex justify-center items-center p-20">
              <span className="text-gray-700">
                Not found.
              </span>
              </div>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default MerryPackage;
