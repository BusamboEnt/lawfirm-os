import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MattersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("matters")
    .select("*")
    .order("created_at", { ascending: false });

  if (q)
    query = query.or(
      `title.ilike.%${q}%,matter_number.ilike.%${q}%,practice_area.ilike.%${q}%`
    );
  if (status) query = query.eq("status", status);

  const { data: matters } = await query;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Matters</h1>
        <Link
          href="/matters/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Matter
        </Link>
      </div>

      <form method="GET" className="mt-4 flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by title, matter #, or practice area..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Search
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Matter #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Practice Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Opened
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {matters?.map((matter) => (
              <tr key={matter.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-brand-600">
                  <Link href={`/matters/${matter.id}`}>
                    {matter.matter_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {matter.title}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      matter.status === "open"
                        ? "bg-green-100 text-green-800"
                        : matter.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {matter.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {matter.practice_area}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {matter.date_opened}
                </td>
              </tr>
            ))}
            {(!matters || matters.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No matters yet. Create your first matter to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
