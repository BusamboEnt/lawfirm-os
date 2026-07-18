import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: recentEntries } = await supabase
    .from("time_entries")
    .select("*, matters(title, matter_number), profiles(full_name)")
    .order("date", { ascending: false })
    .limit(20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Time & Billing</h1>

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
                Attorney
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {recentEntries?.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {entry.date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(entry.matters as any)?.matter_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(entry.profiles as any)?.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {entry.description}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {(entry.duration_min / 60).toFixed(1)}h
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      entry.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : entry.status === "submitted"
                        ? "bg-blue-100 text-blue-800"
                        : entry.status === "billed"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!recentEntries || recentEntries.length === 0) && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No time entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
