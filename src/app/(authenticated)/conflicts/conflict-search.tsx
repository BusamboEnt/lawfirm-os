"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ClientHit = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
};

type MatterHit = {
  id: string;
  matter_number: string;
  title: string;
  status: string;
};

export function ConflictSearch() {
  const supabase = createClient();

  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<ClientHit[]>([]);
  const [matters, setMatters] = useState<MatterHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setLoading(true);

    const pattern = `%${term}%`;
    const [clientRes, matterRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, company, email")
        .or(`name.ilike.${pattern},company.ilike.${pattern},email.ilike.${pattern}`)
        .limit(25),
      supabase
        .from("matters")
        .select("id, matter_number, title, status")
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .limit(25),
    ]);

    setClients(clientRes.data ?? []);
    setMatters(matterRes.data ?? []);
    setSearched(true);
    setLoading(false);
  }

  const hasHits = clients.length > 0 || matters.length > 0;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, company, or email of the prospective client or adverse party..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="whitespace-nowrap rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Run Check"}
        </button>
      </form>

      {searched && !hasHits && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          No matches found for &ldquo;{query.trim()}&rdquo;. No conflicts
          detected in the current records. Document this check in the client
          file before proceeding.
        </div>
      )}

      {searched && hasHits && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Potential matches found — review each record below before opening a
          new engagement.
        </div>
      )}

      {clients.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Matching Clients
          </h2>
          <div className="mt-2 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="block px-4 py-3 hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-brand-600">{c.name}</p>
                <p className="text-xs text-gray-500">
                  {[c.company, c.email].filter(Boolean).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {matters.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Matching Matters
          </h2>
          <div className="mt-2 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm">
            {matters.map((m) => (
              <Link
                key={m.id}
                href={`/matters/${m.id}`}
                className="block px-4 py-3 hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-brand-600">
                  {m.matter_number} — {m.title}
                </p>
                <p className="text-xs capitalize text-gray-500">{m.status}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
