"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Scale,
  FolderPlus,
} from "lucide-react";
import {
  DietaryType,
  formatINR,
  rupeesToPaise,
  SpiceLevel,
} from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemPriceRupees, setItemPriceRupees] = useState("280");
  const [itemPackagingRupees, setItemPackagingRupees] = useState("15");
  const [itemDietary, setItemDietary] = useState<DietaryType>("VEG");
  const [itemSpice, setItemSpice] = useState<SpiceLevel>("MEDIUM");
  const [itemPrepTime, setItemPrepTime] = useState("15");
  const [itemImageUrl, setItemImageUrl] = useState("");

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: () => apiFetch("/menu"),
  });

  const categories = menuData?.categories || [];
  const items = menuData?.items || [];

  const filteredItems =
    selectedCategory === "ALL"
      ? items
      : items.filter((i: any) => String(i.categoryId) === selectedCategory);

  function openAddItemModal() {
    setEditingItem(null);
    setItemName("");
    setItemDesc("");
    setItemCategoryId(categories[0]?._id || "");
    setItemPriceRupees("280");
    setItemPackagingRupees("15");
    setItemDietary("VEG");
    setItemSpice("MEDIUM");
    setItemPrepTime("15");
    setItemImageUrl("");
    setItemModalOpen(true);
  }

  function openEditItemModal(item: any) {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description || "");
    setItemCategoryId(String(item.categoryId));
    setItemPriceRupees(String(item.pricePaise / 100));
    setItemPackagingRupees(String((item.packagingCostPaise || 0) / 100));
    setItemDietary(item.dietaryType);
    setItemSpice(item.spiceLevel);
    setItemPrepTime(String(item.prepTimeMinutes || 15));
    setItemImageUrl(item.imageUrl || "");
    setItemModalOpen(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        name: itemName,
        description: itemDesc,
        categoryId: itemCategoryId || categories[0]?._id,
        pricePaise: rupeesToPaise(Number(itemPriceRupees) || 0),
        packagingCostPaise: rupeesToPaise(Number(itemPackagingRupees) || 0),
        dietaryType: itemDietary,
        spiceLevel: itemSpice,
        prepTimeMinutes: Number(itemPrepTime) || 15,
        imageUrl: itemImageUrl,
        isAvailable: editingItem ? editingItem.isAvailable : true,
      };

      if (editingItem) {
        await apiFetch(`/menu/${editingItem._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast({ title: `Updated '${itemName}'`, variant: "success" });
      } else {
        await apiFetch("/menu", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: `Added '${itemName}' to menu`, variant: "success" });
      }

      setItemModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    } catch (err: any) {
      toast({
        title: "Failed to save menu item",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleToggleAvailability(item: any) {
    try {
      await apiFetch(`/menu/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      toast({
        title: `${item.name} is now ${
          !item.isAvailable ? "Available" : "Unavailable"
        }`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    } catch (err: any) {
      toast({
        title: "Failed to update item",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleDeleteItem(item: any) {
    try {
      await apiFetch(`/menu/${item._id}`, { method: "DELETE" });
      toast({ title: `Deleted '${item.name}'`, variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/menu/categories", {
        method: "POST",
        body: JSON.stringify({
          name: catName,
          description: catDesc,
          sortOrder: categories.length + 1,
        }),
      });
      toast({ title: `Created category '${catName}'`, variant: "success" });
      setCatName("");
      setCatDesc("");
      setCatModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    } catch (err: any) {
      toast({
        title: "Failed to create category",
        description: err?.message,
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#101820]">
            Menu Catalog & Dietary Engineering
          </h2>
          <p className="text-xs text-[#64748B]">
            Manage dishes, integer paise pricing, packaging fees, and QR
            availability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCatModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#101820] hover:bg-[#F1EFE9]"
          >
            <FolderPlus className="h-4 w-4 text-[#C6A15B]" />
            Add Category
          </button>
          <button
            type="button"
            onClick={openAddItemModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541]"
          >
            <Plus className="h-4 w-4 text-[#20A67A]" />
            Add Menu Item
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
            selectedCategory === "ALL"
              ? "bg-[#176B52] text-white"
              : "bg-white border border-[#E5E7EB] text-[#64748B]"
          }`}
        >
          All Dishes ({items.length})
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat._id}
            type="button"
            onClick={() => setSelectedCategory(String(cat._id))}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
              selectedCategory === String(cat._id)
                ? "bg-[#176B52] text-white"
                : "bg-white border border-[#E5E7EB] text-[#64748B]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-12 text-center space-y-2">
          <p className="font-display font-bold text-base text-[#101820]">
            No menu items in this category yet
          </p>
          <p className="text-xs text-[#64748B]">
            Click “Add Menu Item” above to create your first dish.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item: any) => (
            <div
              key={item._id}
              className={`rounded-2xl border bg-white p-5 shadow-card flex flex-col justify-between space-y-4 ${
                item.isAvailable
                  ? "border-[#E5E7EB]"
                  : "border-stone-300 opacity-70"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        item.dietaryType === "NON_VEG"
                          ? "bg-red-100 text-red-900"
                          : item.dietaryType === "JAIN"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {item.dietaryType}
                    </span>
                    <span className="rounded bg-[#F1EFE9] px-2 py-0.5 text-[10px] font-semibold text-[#64748B]">
                      {item.spiceLevel}
                    </span>
                    {item.hasRecipe ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#E8F3EF] px-2 py-0.5 text-[10px] font-semibold text-[#101820]">
                        <Scale className="h-3 w-3" />
                        Recipe Costed
                      </span>
                    ) : (
                      <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        Missing Recipe
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-base text-[#101820]">
                    {formatINR(item.pricePaise)}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-[#101820]">
                  {item.name}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {item.description || "No description provided."}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    item.isAvailable
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-stone-100 text-stone-700 border border-stone-300"
                  }`}
                >
                  {item.isAvailable ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      In Stock
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Sold Out
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditItemModal(item)}
                    className="rounded-lg border border-[#E5E7EB] p-1.5 text-[#101820] hover:bg-[#F1EFE9]"
                    title="Edit Dish"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                    title="Delete Dish"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#101820]">
              {editingItem ? `Edit ${editingItem.name}` : "Add New Menu Item"}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Dish Name *
                </label>
                <input
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                  placeholder="Nagpuri Saoji Chicken Curry"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                  >
                    {categories.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Selling Price (₹ INR) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.5"
                    value={itemPriceRupees}
                    onChange={(e) => setItemPriceRupees(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Dietary Badge
                  </label>
                  <select
                    value={itemDietary}
                    onChange={(e) =>
                      setItemDietary(e.target.value as DietaryType)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs"
                  >
                    <option value="VEG">VEG</option>
                    <option value="NON_VEG">NON_VEG</option>
                    <option value="EGG">EGG</option>
                    <option value="JAIN">JAIN</option>
                    <option value="VEGAN">VEGAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Spice Level
                  </label>
                  <select
                    value={itemSpice}
                    onChange={(e) => setItemSpice(e.target.value as SpiceLevel)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs"
                  >
                    <option value="MILD">MILD</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HOT">HOT</option>
                    <option value="SAOJI_FIERY">SAOJI_FIERY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Packaging (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemPackagingRupees}
                    onChange={(e) => setItemPackagingRupees(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#176B52] px-5 py-2 text-xs font-semibold text-white"
                >
                  {editingItem ? "Save Changes" : "Create Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#101820]">
              Create Menu Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Category Name *
                </label>
                <input
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                  placeholder="Vidarbha Thalis"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Description
                </label>
                <input
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
