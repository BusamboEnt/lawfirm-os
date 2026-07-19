import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, matters(title, matter_number)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link
          href="/billing/invoices/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Generate Invoice
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Matter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Issued
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Due
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {invoices?.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-brand-600">
                  {inv.invoice_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(inv.matters as any)?.matter_number} —{" "}
                  {(inv.matters as any)?.title}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {inv.issued_date ?? "—"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {inv.due_date ?? "—"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                  ${(inv.total_cents / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : inv.status === "sent"
                        ? "bg-blue-100 text-blue-800"
                        : inv.status === "overdue"
                        ? "bg-red-100 text-red-800"
                        : inv.status === "void"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!invoices || invoices.length === 0) && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
