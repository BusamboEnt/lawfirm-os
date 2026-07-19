"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UnbilledEntry = {
  id: string;
  date: string;
  duration_min: number;
  description: string;
  rate_cents: number | null;
  profiles: { full_name: string } | null;
};

export function InvoiceForm() {
  const router = useRouter();
  const supabase = createClient();

  const [matters, setMatters] = useState<{ id: string; matter_number: string; title: string }[]>([]);
  const [matterId, setMatterId] = useState("");
  const [entries, setEntries] = useState<UnbilledEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [defaultRate, setDefaultRate] = useState("250");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("matters")
      .select("id, matter_number, title")
      .order("matter_number")
      .then(({ data }) => {
        if (data) setMatters(data);
      });
  }, []);

  useEffect(() => {
    if (!matterId) {
      setEntries([]);
      setSelected(new Set());
      return;
    }
    supabase
      .from("time_entries")
      .select("id, date, duration_min, description, rate_cents, profiles(full_name)")
      .eq("matter_id", matterId)
      .eq("billable", true)
      .is("invoice_id", null)
      .neq("status", "billed")
      .order("date")
      .then(({ data }) => {
        const rows = (data as unknown as UnbilledEntry[]) ?? [];
        setEntries(rows);
        setSelected(new Set(rows.map((r) => r.id)));
      });
  }, [matterId]);

  function entryAmountCents(entry: UnbilledEntry): number {
    const rate = entry.rate_cents ?? Math.round(parseFloat(defaultRate || "0") * 100);
    return Math.round((entry.duration_min / 60) * rate);
  }

  const totalCents = entries
    .filter((e) => selected.has(e.id))
    .reduce((sum, e) => sum + entryAmountCents(e), 0);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      setError("Select at least one time entry.");
      return;
    }
    setLoading(true);
    setError("");

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .insert({
        matter_id: matterId,
        invoice_number: invoiceNumber,
        status: "draft",
        issued_date: new Date().toISOString().slice(0, 10),
        due_date: dueDate || null,
        total_cents: totalCents,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (invError || !invoice) {
      setError(invError?.message ?? "Failed to create invoice.");
      setLoading(false);
      return;
    }

    const defaultRateCents = Math.round(parseFloat(defaultRate || "0") * 100);
    for (const entry of entries.filter((en) => selected.has(en.id))) {
      const { error: updError } = await supabase
        .from("time_entries")
        .update({
          invoice_id: invoice.id,
          status: "billed",
          rate_cents: entry.rate_cents ?? defaultRateCents,
        })
        .eq("id", entry.id);
      if (updError) {
        setError(`Invoice created, but failed to attach an entry: ${updError.message}`);
        setLoading(false);
        return;
      }
    }

    router.push("/billing/invoices");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Matter *
          </label>
          <select
            required
            value={matterId}
            onChange={(e) => setMatterId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select a matter...</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.matter_number} — {m.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Hourly Rate ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={defaultRate}
            onChange={(e) => setDefaultRate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Applied to entries without their own rate.
          </p>
        </div>
      </div>

      {matterId && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Unbilled Time Entries
          </h2>
          {entries.length === 0 ? (
            <p className="mt-2 rounded-md bg-gray-50 p-4 text-sm text-gray-500">
              No unbilled billable time entries for this matter.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200">
              {entries.map((entry) => (
                <label
                  key={entry.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggle(entry.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{entry.description}</p>
                    <p className="text-xs text-gray-500">
                      {entry.date} · {entry.profiles?.full_name} ·{" "}
                      {(entry.duration_min / 60).toFixed(1)}h
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${(entryAmountCents(entry) / 100).toFixed(2)}
                  </span>
                </label>
              ))}
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">
                  Total ({selected.size} entries)
                </span>
                <span className="text-base font-bold text-gray-900">
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !matterId || selected.size === 0}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Invoice"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
