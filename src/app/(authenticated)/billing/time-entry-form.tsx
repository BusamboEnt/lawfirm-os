"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TimeEntryForm() {
  const router = useRouter();
  const supabase = createClient();

  const [matters, setMatters] = useState<{ id: string; matter_number: string; title: string }[]>([]);
  const [form, setForm] = useState({
    matter_id: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    minutes: "",
    description: "",
    billable: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("matters")
      .select("id, matter_number, title")
      .eq("status", "open")
      .order("matter_number")
      .then(({ data }) => {
        if (data) setMatters(data);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const hours = parseInt(form.hours || "0");
    const minutes = parseInt(form.minutes || "0");
    const duration_min = hours * 60 + minutes;

    if (duration_min <= 0) {
      setError("Duration must be greater than zero.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from("time_entries").insert({
      matter_id: form.matter_id,
      user_id: user!.id,
      date: form.date,
      duration_min,
      description: form.description,
      billable: form.billable,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/billing");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Matter *
        </label>
        <select
          required
          value={form.matter_id}
          onChange={(e) => setForm({ ...form, matter_id: e.target.value })}
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
          Date *
        </label>
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Hours
          </label>
          <input
            type="number"
            min="0"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            placeholder="0"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Minutes
          </label>
          <input
            type="number"
            min="0"
            max="59"
            value={form.minutes}
            onChange={(e) => setForm({ ...form, minutes: e.target.value })}
            placeholder="0"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Work performed..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="billable"
          checked={form.billable}
          onChange={(e) => setForm({ ...form, billable: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="billable" className="text-sm text-gray-700">
          Billable
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Log Time"}
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
