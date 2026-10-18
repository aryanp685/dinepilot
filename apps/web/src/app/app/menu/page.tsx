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
  Search,
  Utensils,
} from "lucide-react";
import {
  DietaryType,
  formatINR,
  rupeesToPaise,
  SpiceLevel,
} from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";
import {
  PageHeader,
  StatusPill,
  AccessibleModal,
  EmptyStateCard,
} from "@/components/ui/DesignSystem";

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [dietaryFilter, setDietaryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredItems = items.filter((i: any) => {
    const matchCategory =
      selectedCategory === "ALL" ||
      String(i.categoryId) === selectedCategory;
    const matchDietary =
      dietaryFilter === "ALL" || i.dietaryType === dietaryFilter;
    const matchSearch =
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchDietary && matchSearch;
  });

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
      <PageHeader
        eyebrow="Digital Menu & Category Catalog"
        title="Menu & Category Management"
        subtitle="Manage categories, integer paise pricing, dietary tags, preparation times, and instant QR stock availability."
        actions={
          <>
            <button
              type="button"
              onClick={() => setCatModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3] transition-colors"
            >
              <FolderPlus className="h-4 w-4 text-[#176B52]" />
              Add Category
            </button>
            <button
              type="button"
              onClick={openAddItemModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541] shadow-card transition-colors"
            >
              <Plus className="h-4 w-4 text-[#20A67A]" />
              Add Menu Item
            </button>
          </>
        }
      />

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-card space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-[#176B52] text-white"
                  : "bg-[#F8F7F3] text-[#64748B] hover:text-[#121715]"
              }`}
            >
              All Categories ({items.length})
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => setSelectedCategory(String(cat._id))}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === String(cat._id)
                    ? "bg-[#176B52] text-white"
                    : "bg-[#F8F7F3] text-[#64748B] hover:text-[#121715]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              aria-label="Filter by dietary type"
              className="rounded-lg border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-1.5 text-xs font-semibold text-[#121715]"
            >
              <option value="ALL">All Dietary Tags</option>
              <option value="VEG">VEG</option>
              <option value="NON_VEG">NON-VEG</option>
              <option value="JAIN">JAIN</option>
              <option value="VEGAN">VEGAN</option>
              <option value="EGG">EGG</option>
            </select>

            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#64748B] absolute left-3 top-2.5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish name..."
                className="rounded-lg border border-[#E5E7EB] bg-[#F8F7F3] pl-8 pr-3 py-1.5 text-xs w-48 focus:bg-white"
              />
            </div>
          </div>
        </div>
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
        <EmptyStateCard
          icon={<Utensils className="h-5 w-5" />}
          title="No menu items match the current filter"
          description="Try clearing your category or search filter, or add a new dish to your catalog."
          action={
            <button
              type="button"
              onClick={openAddItemModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Menu Item
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item: any) => (
            <div
              key={item._id}
              className={`rounded-2xl border bg-white p-5 shadow-card flex flex-col justify-between space-y-4 transition-shadow hover:shadow-editorial ${
                item.isAvailable
                  ? "border-[#E5E7EB]"
                  : "border-stone-300 opacity-75"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusPill
                      tone={
                        item.dietaryType === "NON_VEG"
                          ? "crimson"
                          : item.dietaryType === "JAIN"
                          ? "amber"
                          : "emerald"
                      }
                    >
                      {item.dietaryType}
                    </StatusPill>
                    <StatusPill tone="neutral">{item.spiceLevel}</StatusPill>
                    {item.hasRecipe ? (
                      <StatusPill tone="forest">
                        <Scale className="h-3 w-3" />
                        Recipe Costed
                      </StatusPill>
                    ) : (
                      <StatusPill tone="amber">Missing Recipe</StatusPill>
                    )}
                  </div>
                  <span className="font-mono font-bold text-base text-[#121715]">
                    {formatINR(item.pricePaise)}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-[#121715]">
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
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    item.isAvailable
                      ? "bg-[#E6F7F1] text-[#176B52] border border-[#20A67A]/30"
                      : "bg-stone-100 text-stone-700 border border-stone-300"
                  }`}
                >
                  {item.isAvailable ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#20A67A]" />
                      In Stock (QR Live)
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Sold Out (86&apos;d)
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditItemModal(item)}
                    className="rounded-lg border border-[#E5E7EB] p-1.5 text-[#121715] hover:bg-[#F8F7F3]"
                    title="Edit Dish"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                    title="Delete Dish"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccessibleModal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? `Edit ${editingItem.name}` : "Add New Menu Item"}
        subtitle="Configure dish name, category, selling price in INR, dietary badge, spice level, and packaging charge."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#121715] mb-1">
              Dish Name *
            </label>
            <input
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
              placeholder="Nagpuri Saoji Chicken Curry"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Category *
              </label>
              <select
                required
                value={itemCategoryId}
                onChange={(e) => setItemCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-2 text-xs"
              >
                {categories.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Selling Price (₹ INR) *
              </label>
              <input
                required
                type="number"
                min="1"
                step="0.5"
                value={itemPriceRupees}
                onChange={(e) => setItemPriceRupees(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Dietary Badge
              </label>
              <select
                value={itemDietary}
                onChange={(e) => setItemDietary(e.target.value as DietaryType)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-2.5 py-2 text-xs"
              >
                <option value="VEG">VEG</option>
                <option value="NON_VEG">NON_VEG</option>
                <option value="EGG">EGG</option>
                <option value="JAIN">JAIN</option>
                <option value="VEGAN">VEGAN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Spice Level
              </label>
              <select
                value={itemSpice}
                onChange={(e) => setItemSpice(e.target.value as SpiceLevel)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-2.5 py-2 text-xs"
              >
                <option value="MILD">MILD</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HOT">HOT</option>
                <option value="SAOJI_FIERY">SAOJI_FIERY</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Packaging (₹)
              </label>
              <input
                type="number"
                min="0"
                value={itemPackagingRupees}
                onChange={(e) => setItemPackagingRupees(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-2.5 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Est. Prep Time (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={itemPrepTime}
                onChange={(e) => setItemPrepTime(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Dish Image URL (Optional)
              </label>
              <input
                value={itemImageUrl}
                onChange={(e) => setItemImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#121715] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setItemModalOpen(false)}
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#176B52] px-5 py-2 text-xs font-semibold text-white hover:bg-[#125541]"
            >
              {editingItem ? "Save Changes" : "Create Dish"}
            </button>
          </div>
        </form>
      </AccessibleModal>

      <AccessibleModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Create Menu Category"
        subtitle="Group related dishes on your digital QR menu and Staff POS screen."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#121715] mb-1">
              Category Name *
            </label>
            <input
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
              placeholder="Vidarbha Thalis"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121715] mb-1">
              Description
            </label>
            <input
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#121715]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541]"
            >
              Create Category
            </button>
          </div>
        </form>
      </AccessibleModal>
    </div>
  );
}
