"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TrustEntryForm() {
  const router = useRouter();
  const supabase = createClient();

  const [matters, setMatters] = useState<{ id: string; matter_number: string; title: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    matter_id: "",
    client_id: "",
    txn_type: "deposit" as string,
    amount: "",
    account: "trust",
    description: "",
    reference: "",
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
    supabase
      .from("clients")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setClients(data);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (!amountCents || amountCents <= 0) {
      setError("Amount must be greater than zero.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from("trust_ledger").insert({
      matter_id: form.matter_id,
      client_id: form.client_id,
      txn_type: form.txn_type,
      amount_cents: amountCents,
      account: form.account,
      description: form.description,
      reference: form.reference || null,
      performed_by: user!.id,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/trust");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
        Trust ledger entries are permanent and cannot be edited or deleted.
        Please review carefully before submitting.
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            Client *
          </label>
          <select
            required
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Transaction Type *
          </label>
          <select
            required
            value={form.txn_type}
            onChange={(e) => setForm({ ...form, txn_type: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer_to_operating">Transfer to Operating</option>
            <option value="interest">Interest</option>
            <option value="refund">Refund</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account *
          </label>
          <select
            required
            value={form.account}
            onChange={(e) => setForm({ ...form, account: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="trust">Trust (IOLTA)</option>
            <option value="operating">Operating</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount ($) *
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reference / Check #
          </label>
          <input
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder="Optional"
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
          rows={2}
          placeholder="Description of transaction..."
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
          {loading ? "Recording..." : "Record Entry"}
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
