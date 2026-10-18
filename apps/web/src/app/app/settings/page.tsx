"use client";

import React, { useEffect, useState } from "react";
import { Save, Palette, ReceiptIndianRupee, Store } from "lucide-react";
import { QrThemePreset, TaxMode } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useAuth, useToast } from "@/providers/AppProviders";

export default function SettingsPage() {
  const { restaurant, refreshAuth } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [city, setCity] = useState("Nagpur");
  const [state, setState] = useState("Maharashtra");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [qrThemePreset, setQrThemePreset] =
    useState<QrThemePreset>("botanical");

  const [taxMode, setTaxMode] = useState<TaxMode>("TAX_EXCLUSIVE");
  const [cgstRateBps, setCgstRateBps] = useState("250");
  const [sgstRateBps, setSgstRateBps] = useState("250");
  const [serviceChargeRateBps, setServiceChargeRateBps] = useState("0");
  const [enableRoundOff, setEnableRoundOff] = useState(true);
  const [allowRunningTableKots, setAllowRunningTableKots] = useState(true);
  const [allowDeliveryOrders, setAllowDeliveryOrders] = useState(true);
  const [operatingHoursOpen, setOperatingHoursOpen] = useState("11:00");
  const [operatingHoursClose, setOperatingHoursClose] = useState("23:30");

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setCity(restaurant.city);
      setState(restaurant.state);
      setAddress(restaurant.address || "");
      setGstin(restaurant.gstin || "");
      setFssaiNumber(restaurant.fssaiNumber || "");
      setUpiVpa(restaurant.upiVpa || "");
      setQrThemePreset(restaurant.qrThemePreset || "botanical");

      if (restaurant.settings) {
        setTaxMode(restaurant.settings.taxMode);
        setCgstRateBps(String(restaurant.settings.cgstRateBps));
        setSgstRateBps(String(restaurant.settings.sgstRateBps));
        setServiceChargeRateBps(
          String(restaurant.settings.serviceChargeRateBps)
        );
        setEnableRoundOff(restaurant.settings.enableRoundOff);
        setAllowRunningTableKots(restaurant.settings.allowRunningTableKots);
        setAllowDeliveryOrders(restaurant.settings.allowDeliveryOrders);
        setOperatingHoursOpen(restaurant.settings.operatingHoursOpen);
        setOperatingHoursClose(restaurant.settings.operatingHoursClose);
      }
    }
  }, [restaurant]);

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    try {
      await Promise.all([
        apiFetch("/restaurant", {
          method: "PATCH",
          body: JSON.stringify({
            name,
            city,
            state,
            address,
            gstin,
            fssaiNumber,
            upiVpa,
            qrThemePreset,
          }),
        }),
        apiFetch("/restaurant/settings", {
          method: "PATCH",
          body: JSON.stringify({
            taxMode,
            cgstRateBps: Number(cgstRateBps) || 0,
            sgstRateBps: Number(sgstRateBps) || 0,
            serviceChargeRateBps: Number(serviceChargeRateBps) || 0,
            enableRoundOff,
            allowRunningTableKots,
            allowDeliveryOrders,
            operatingHoursOpen,
            operatingHoursClose,
          }),
        }),
      ]);

      await refreshAuth();
      toast({
        title: "Restaurant & GST settings saved",
        description: "Updated tax rules and QR menu theme preset.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Failed to save settings",
        description: err?.message,
        variant: "error",
      });
    }
  }

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#101820]">
            Restaurant Profile, GST Billing & QR Theme Settings
          </h2>
          <p className="text-xs text-[#64748B]">
            Configure Indian GST modes, NPCI UPI VPA, and guest ordering theme
            presets
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#125541]"
        >
          <Save className="h-4 w-4 text-[#20A67A]" />
          Save All Settings
        </button>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <Store className="h-4 w-4 text-[#101820]" />
          <h3 className="font-display font-bold text-base text-[#101820]">
            Restaurant Identity & Statutory Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Restaurant Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">GSTIN</label>
            <input
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              FSSAI License Number
            </label>
            <input
              value={fssaiNumber}
              onChange={(e) => setFssaiNumber(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Verified Merchant UPI VPA
            </label>
            <input
              value={upiVpa}
              onChange={(e) => setUpiVpa(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono"
              placeholder="saojikitchen@okicici"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <ReceiptIndianRupee className="h-4 w-4 text-[#101820]" />
          <h3 className="font-display font-bold text-base text-[#101820]">
            Indian GST & Billing Rules (Integer Paise)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">GST Tax Mode</label>
            <select
              value={taxMode}
              onChange={(e) => setTaxMode(e.target.value as TaxMode)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 font-semibold"
            >
              <option value="TAX_EXCLUSIVE">
                TAX_EXCLUSIVE (+CGST & SGST)
              </option>
              <option value="TAX_INCLUSIVE">
                TAX_INCLUSIVE (MRP Includes GST)
              </option>
              <option value="COMPOSITION_OR_EXEMPT">
                COMPOSITION_OR_EXEMPT (0% Guest GST)
              </option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">
              CGST Rate (bps, 250 = 2.5%)
            </label>
            <input
              type="number"
              value={cgstRateBps}
              onChange={(e) => setCgstRateBps(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              SGST Rate (bps, 250 = 2.5%)
            </label>
            <input
              type="number"
              value={sgstRateBps}
              onChange={(e) => setSgstRateBps(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Service Charge (bps, 500 = 5%)
            </label>
            <input
              type="number"
              value={serviceChargeRateBps}
              onChange={(e) => setServiceChargeRateBps(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 text-xs">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={enableRoundOff}
              onChange={(e) => setEnableRoundOff(e.target.checked)}
            />
            <span>Enable ₹1 Rupee Round-Off on Final Guest Bill</span>
          </label>
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={allowRunningTableKots}
              onChange={(e) => setAllowRunningTableKots(e.target.checked)}
            />
            <span>Allow Running Table Sessions (Multiple KOTs per Table)</span>
          </label>
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={allowDeliveryOrders}
              onChange={(e) => setAllowDeliveryOrders(e.target.checked)}
            />
            <span>Enable Delivery Orders on Public QR Menu</span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <Palette className="h-4 w-4 text-[#C6A15B]" />
          <h3 className="font-display font-bold text-base text-[#101820]">
            Guest QR Menu Theme Preset (4 Original Presets)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: "botanical" as const,
              title: "Botanical Bistro",
              desc: "Deep forest green & warm alabaster paper",
              swatch: "bg-[#176B52] text-[#20A67A]",
            },
            {
              id: "midnight" as const,
              title: "Midnight Izakaya",
              desc: "Obsidian slate & glowing saffron amber",
              swatch: "bg-[#0C1116] text-amber-400",
            },
            {
              id: "terracotta" as const,
              title: "Terracotta Spice",
              desc: "Warm clay crimson & roasted parchment",
              swatch: "bg-[#5C1F14] text-orange-200",
            },
            {
              id: "nordic" as const,
              title: "Minimalist Nordic",
              desc: "High-contrast monochrome editorial",
              swatch: "bg-zinc-900 text-white",
            },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setQrThemePreset(preset.id)}
              className={`text-left rounded-xl border p-4 transition-all space-y-2 ${
                qrThemePreset === preset.id
                  ? "border-[#176B52] ring-2 ring-[#176B52] bg-[#F8F7F3]"
                  : "border-[#E5E7EB] bg-white hover:bg-[#F8F7F3]"
              }`}
            >
              <div
                className={`h-8 w-full rounded-lg flex items-center px-3 text-xs font-bold ${preset.swatch}`}
              >
                {preset.title}
              </div>
              <p className="text-xs text-[#64748B]">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
