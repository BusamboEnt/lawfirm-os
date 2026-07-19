import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: matter } = await supabase
    .from("matters")
    .select("*")
    .eq("id", id)
    .single();

  if (!matter) notFound();

  const [
    { data: members },
    { data: clients },
    { data: tasks },
    { data: documents },
    { data: timeEntries },
  ] = await Promise.all([
    supabase
      .from("matter_members")
      .select("*, profiles(full_name, role)")
      .eq("matter_id", id),
    supabase
      .from("matter_clients")
      .select("*, clients(name, email)")
      .eq("matter_id", id),
    supabase
      .from("tasks")
      .select("*")
      .eq("matter_id", id)
      .order("due_date", { ascending: true })
      .limit(10),
    supabase
      .from("documents")
      .select("*")
      .eq("matter_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("time_entries")
      .select("*, profiles(full_name)")
      .eq("matter_id", id)
      .order("date", { ascending: false })
      .limit(10),
  ]);

  const totalMinutes =
    timeEntries?.reduce((sum, e) => sum + e.duration_min, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{matter.matter_number}</p>
          <h1 className="text-2xl font-bold text-gray-900">{matter.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/matters/${id}/edit`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              matter.status === "open"
                ? "bg-green-100 text-green-800"
                : matter.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {matter.status}
          </span>
        </div>
      </div>

      {matter.description && (
        <p className="mt-2 text-gray-600">{matter.description}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-900">Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Practice Area</dt>
              <dd className="text-gray-900">
                {matter.practice_area ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Opened</dt>
              <dd className="text-gray-900">{matter.date_opened}</dd>
            </div>
            {matter.date_closed && (
              <div>
                <dt className="text-gray-500">Closed</dt>
                <dd className="text-gray-900">{matter.date_closed}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Total Time</dt>
              <dd className="text-gray-900">
                {(totalMinutes / 60).toFixed(1)} hours
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-900">Team</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {members?.map((m) => (
              <li key={m.user_id} className="flex justify-between">
                <span className="text-gray-900">
                  {(m.profiles as any)?.full_name}
                </span>
                <span className="text-gray-500 capitalize">
                  {(m.profiles as any)?.role}
                </span>
              </li>
            ))}
            {(!members || members.length === 0) && (
              <li className="text-gray-500">No team members assigned.</li>
            )}
          </ul>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-900">Clients</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {clients?.map((mc) => (
              <li key={mc.client_id}>
                <Link
                  href={`/clients/${mc.client_id}`}
                  className="text-brand-600 hover:underline"
                >
                  {(mc.clients as any)?.name}
                </Link>
                <span className="ml-2 text-gray-500">
                  {(mc.clients as any)?.email}
                </span>
              </li>
            ))}
            {(!clients || clients.length === 0) && (
              <li className="text-gray-500">No clients linked.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-900">Tasks & Deadlines</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {tasks?.map((task) => (
              <li key={task.id} className="flex justify-between">
                <span
                  className={
                    task.status === "completed"
                      ? "text-gray-400 line-through"
                      : "text-gray-900"
                  }
                >
                  {task.title}
                </span>
                {task.due_date && (
                  <span className="text-gray-500">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </li>
            ))}
            {(!tasks || tasks.length === 0) && (
              <li className="text-gray-500">No tasks.</li>
            )}
          </ul>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-900">Recent Documents</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {documents?.map((doc) => (
              <li key={doc.id} className="flex justify-between">
                <span className="text-gray-900">{doc.file_name}</span>
                <span className="text-gray-500">v{doc.version}</span>
              </li>
            ))}
            {(!documents || documents.length === 0) && (
              <li className="text-gray-500">No documents.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
        <h3 className="font-medium text-gray-900">Recent Time Entries</h3>
        <table className="mt-3 min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">Date</th>
              <th className="pb-2">Attorney</th>
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {timeEntries?.map((entry) => (
              <tr key={entry.id}>
                <td className="py-1 text-gray-900">{entry.date}</td>
                <td className="py-1 text-gray-500">
                  {(entry.profiles as any)?.full_name}
                </td>
                <td className="py-1 text-gray-500">{entry.description}</td>
                <td className="py-1 text-right text-gray-900">
                  {(entry.duration_min / 60).toFixed(1)}
                </td>
              </tr>
            ))}
            {(!timeEntries || timeEntries.length === 0) && (
              <tr>
                <td colSpan={4} className="py-2 text-gray-500">
                  No time entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
