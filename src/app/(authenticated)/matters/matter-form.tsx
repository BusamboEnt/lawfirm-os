"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface MatterFormProps {
  matter?: {
    id: string;
    matter_number: string;
    title: string;
    status: string;
    practice_area: string | null;
    description: string | null;
  };
}

const PRACTICE_AREAS = [
  "Corporate",
  "Litigation",
  "Real Estate",
  "Family Law",
  "Criminal Defense",
  "Estate Planning",
  "Employment",
  "Immigration",
  "Intellectual Property",
  "Bankruptcy",
  "Tax",
  "Environmental",
  "Other",
];

export function MatterForm({ matter }: MatterFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!matter;

  const [form, setForm] = useState({
    matter_number: matter?.matter_number ?? "",
    title: matter?.title ?? "",
    status: matter?.status ?? "open",
    practice_area: matter?.practice_area ?? "",
    description: matter?.description ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      matter_number: form.matter_number,
      title: form.title,
      status: form.status,
      practice_area: form.practice_area || null,
      description: form.description || null,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("matters").update(payload).eq("id", matter.id)
      : await supabase.from("matters").insert(payload);

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/matters");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Matter Number *
          </label>
          <input
            required
            value={form.matter_number}
            onChange={(e) => setForm({ ...form, matter_number: e.target.value })}
            placeholder="e.g. 2024-001"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Matter title"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Practice Area
        </label>
        <select
          value={form.practice_area}
          onChange={(e) => setForm({ ...form, practice_area: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Select...</option>
          {PRACTICE_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Matter" : "Create Matter"}
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
