"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ConflictHit = { kind: "client" | "matter"; id: string; label: string };

const PRACTICE_AREAS = [
  "Litigation",
  "Personal Injury",
  "Family Law",
  "Estate Planning & Probate",
  "Business & Corporate",
  "Real Estate",
  "Criminal Defense",
  "Immigration",
  "Employment",
  "Other",
];

export function IntakeForm() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    practice_area: "",
    matter_description: "",
    referral_source: "",
    adverse_parties: "",
    notes: "",
  });
  const [conflicts, setConflicts] = useState<ConflictHit[] | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runConflictCheck(): Promise<ConflictHit[]> {
    const names = [form.name, form.company, ...form.adverse_parties.split(",")]
      .map((n) => n.trim())
      .filter((n) => n.length > 1);

    const hits: ConflictHit[] = [];
    for (const name of names) {
      const pattern = `%${name}%`;
      const [clientRes, matterRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, company")
          .or(`name.ilike.${pattern},company.ilike.${pattern}`)
          .limit(10),
        supabase
          .from("matters")
          .select("id, matter_number, title")
          .or(`title.ilike.${pattern},description.ilike.${pattern}`)
          .limit(10),
      ]);
      for (const c of clientRes.data ?? []) {
        if (!hits.some((h) => h.kind === "client" && h.id === c.id)) {
          hits.push({ kind: "client", id: c.id, label: c.name });
        }
      }
      for (const m of matterRes.data ?? []) {
        if (!hits.some((h) => h.kind === "matter" && h.id === m.id)) {
          hits.push({
            kind: "matter",
            id: m.id,
            label: `${m.matter_number} — ${m.title}`,
          });
        }
      }
    }
    return hits;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // First pass: run the conflict check and stop for review if it hits.
    if (conflicts === null) {
      const hits = await runConflictCheck();
      setConflicts(hits);
      setLoading(false);
      if (hits.length > 0) return; // require review + acknowledgement
      // no hits — fall through on the next submit
    }

    if (conflicts !== null && conflicts.length > 0 && !acknowledged) {
      setError("Review the potential conflicts and acknowledge before proceeding.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const hits = conflicts ?? [];

    const { data: client, error: dbError } = await supabase
      .from("clients")
      .insert({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        address: form.address || null,
        notes: form.notes || null,
        conflict_check: {
          checked_at: new Date().toISOString(),
          searched: [form.name, form.company, form.adverse_parties].filter(Boolean),
          hits: hits.map((h) => ({ kind: h.kind, id: h.id, label: h.label })),
          acknowledged: hits.length > 0 ? acknowledged : null,
        },
        intake_data: {
          practice_area: form.practice_area || null,
          matter_description: form.matter_description || null,
          referral_source: form.referral_source || null,
          adverse_parties: form.adverse_parties || null,
          submitted_at: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (dbError || !client) {
      setError(dbError?.message ?? "Failed to create client.");
      setLoading(false);
      return;
    }

    router.push(`/clients/${client.id}`);
    router.refresh();
  }

  const showConflicts = conflicts !== null && conflicts.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
        Contact Information
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setConflicts(null);
              setAcknowledged(false);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company / Organization
          </label>
          <input
            value={form.company}
            onChange={(e) => {
              setForm({ ...form, company: e.target.value });
              setConflicts(null);
              setAcknowledged(false);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <h2 className="pt-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Legal Matter
      </h2>
      <div className="grid grid-cols-2 gap-4">
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
            {PRACTICE_AREAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Referral Source
          </label>
          <input
            value={form.referral_source}
            onChange={(e) => setForm({ ...form, referral_source: e.target.value })}
            placeholder="e.g. existing client, website, bar referral"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description of Legal Issue
        </label>
        <textarea
          value={form.matter_description}
          onChange={(e) => setForm({ ...form, matter_description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Adverse / Opposing Parties
        </label>
        <input
          value={form.adverse_parties}
          onChange={(e) => {
            setForm({ ...form, adverse_parties: e.target.value });
            setConflicts(null);
            setAcknowledged(false);
          }}
          placeholder="Comma-separated names — used for the conflict check"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {conflicts !== null && conflicts.length === 0 && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Conflict check passed — no matching clients or matters found. Submit
          again to create the client record.
        </div>
      )}

      {showConflicts && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            Potential conflicts found — review before proceeding:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {conflicts!.map((h) => (
              <li key={`${h.kind}-${h.id}`}>
                <Link
                  href={h.kind === "client" ? `/clients/${h.id}` : `/matters/${h.id}`}
                  target="_blank"
                  className="text-brand-600 hover:underline"
                >
                  {h.kind === "client" ? "Client: " : "Matter: "}
                  {h.label}
                </Link>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex items-center gap-2 text-sm text-yellow-900">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            I have reviewed these records and confirm there is no
            disqualifying conflict of interest.
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading
            ? "Working..."
            : conflicts === null
            ? "Run Conflict Check & Continue"
            : "Create Client"}
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
