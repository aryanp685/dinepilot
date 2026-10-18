"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarClock, Users, Phone } from "lucide-react";
import { ReservationStatus } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useAuth, useToast } from "@/providers/AppProviders";

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const { restaurant } = useAuth();
  const { toast } = useToast();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+91 ");
  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState("20:00");
  const [partySize, setPartySize] = useState("4");
  const [tableId, setTableId] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations", dateFilter],
    queryFn: () =>
      apiFetch(`/reservations${dateFilter ? `?date=${dateFilter}` : ""}`),
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiFetch("/tables"),
  });

  async function handleCreateReservation(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await apiFetch("/reservations", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerPhone,
          date,
          timeSlot,
          partySize: Number(partySize) || 2,
          tableId: tableId || undefined,
          specialRequests,
        }),
      });
      toast({
        title: `Confirmed Reservation ${created.reservationCode}`,
        description: `Assigned Table ${created.tableLabelSnapshot} at ${created.timeSlot}`,
        variant: "success",
      });
      setCustomerName("");
      setSpecialRequests("");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    } catch (err: any) {
      toast({
        title: "Reservation conflict or policy error",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleUpdateStatus(id: string, status: ReservationStatus) {
    try {
      await apiFetch(`/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({
        title: `Reservation marked ${status}`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    } catch (err: any) {
      toast({
        title: "Failed to update reservation",
        description: err?.message,
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F291E]">
            Table Reservations & Slot Allocation
          </h2>
          <p className="text-xs text-[#4A5950]">
            Operating Hours: {restaurant?.settings.operatingHoursOpen || "11:00"}{" "}
            – {restaurant?.settings.operatingHoursClose || "23:30"} IST •
            Concurrency-safe conflict prevention
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-xs font-semibold"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              className="text-xs text-[#4A5950] underline"
            >
              Show All Dates
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F291E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#163829]"
          >
            <Plus className="h-4 w-4 text-[#84CC16]" />
            Book Reservation
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white border border-[#E5E0D5] animate-pulse"
            />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E0D5] bg-white p-12 text-center space-y-2">
          <p className="font-display font-bold text-base text-[#0F291E]">
            No reservations found for this filter
          </p>
          <p className="text-xs text-[#718077]">
            Click “Book Reservation” above to schedule a table booking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map((rsv: any) => (
            <div
              key={rsv._id}
              className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0F291E]">
                      {rsv.reservationCode}
                    </span>
                    <span className="rounded bg-[#E6ECE8] px-2 py-0.5 text-xs font-bold text-[#0F291E]">
                      Table {rsv.tableLabelSnapshot || "Auto"}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        rsv.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-900"
                          : rsv.status === "SEATED"
                          ? "bg-blue-100 text-blue-900"
                          : rsv.status === "CANCELLED"
                          ? "bg-red-100 text-red-900"
                          : "bg-stone-100 text-stone-800"
                      }`}
                    >
                      {rsv.status}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-[#111C16]">
                    {rsv.customerName}
                  </h3>
                  <p className="text-xs text-[#4A5950] flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {rsv.customerPhone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {rsv.partySize} Guests
                    </span>
                  </p>
                </div>

                <div className="text-right font-mono text-xs">
                  <p className="font-bold text-[#0F291E]">{rsv.date}</p>
                  <p className="text-[#D97706] font-bold">{rsv.timeSlot} IST</p>
                </div>
              </div>

              {rsv.specialRequests && (
                <p className="text-xs text-[#4A5950] bg-[#FBF9F5] rounded-lg px-3 py-2 border border-[#E5E0D5]">
                  Note: {rsv.specialRequests}
                </p>
              )}

              <div className="pt-2 border-t border-[#E5E0D5] flex flex-wrap items-center gap-2">
                {(
                  [
                    "SEATED",
                    "COMPLETED",
                    "NO_SHOW",
                    "CANCELLED",
                  ] as ReservationStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={rsv.status === st}
                    onClick={() => handleUpdateStatus(rsv._id, st)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                      rsv.status === st
                        ? "bg-[#0F291E] text-white border-[#0F291E]"
                        : "bg-white border-[#E5E0D5] text-[#4A5950] hover:text-[#0F291E]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E0D5] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F291E]">
              Book Table Reservation
            </h3>
            <form onSubmit={handleCreateReservation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Guest Name *
                </label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Dr. Rajesh Deshpande"
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Guest Phone *
                </label>
                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-2 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Time (HH:mm) *
                  </label>
                  <input
                    required
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-2 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Party Size *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="30"
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-2 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Preferred Table (Optional — Auto-assigns if blank)
                </label>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                >
                  <option value="">Auto-Assign Best Available Table</option>
                  {tables.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.label} ({t.capacity} seats • {t.zone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Special Requests
                </label>
                <input
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Anniversary table, high chair, Jain menu..."
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E5E0D5] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F291E] px-4 py-2 text-xs font-semibold text-white"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
