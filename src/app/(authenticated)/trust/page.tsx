import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TrustPage() {
  const supabase = await createClient();

  const { data: ledger } = await supabase
    .from("trust_ledger")
    .select("*, matters(title, matter_number), clients(name), profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const inflow = ["deposit", "interest", "refund"];
  const totals = (ledger ?? [])
    .filter((e) => e.account === "trust")
    .reduce(
      (acc, e) => {
        if (inflow.includes(e.txn_type)) acc.in += e.amount_cents;
        else acc.out += e.amount_cents;
        return acc;
      },
      { in: 0, out: 0 }
    );

  const summary = [
    { label: "Deposits & Credits", value: totals.in },
    { label: "Withdrawals & Transfers", value: totals.out },
    { label: "Trust Balance", value: totals.in - totals.out },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trust / IOLTA Ledger</h1>
          <p className="mt-1 text-sm text-gray-500">
            Append-only ledger — entries cannot be modified or deleted.
          </p>
        </div>
        <Link
          href="/trust/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Entry
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{s.label}</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                s.label === "Trust Balance" && s.value < 0
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              ${(s.value / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Matter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Account
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                By
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {ledger?.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(entry.matters as any)?.matter_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(entry.clients as any)?.name}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-700">
                    {entry.txn_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {entry.account}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                  ${(entry.amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(entry.profiles as any)?.full_name}
                </td>
              </tr>
            ))}
            {(!ledger || ledger.length === 0) && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No trust ledger entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
