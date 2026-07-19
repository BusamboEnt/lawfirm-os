import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: matterCount },
    { count: taskCount },
    { count: clientCount },
    { data: deadlines },
    { data: recentMatters },
  ] = await Promise.all([
    supabase.from("matters").select("*", { count: "exact", head: true }),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "in_progress"]),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("tasks")
      .select("id, title, due_date, is_court_date, is_sol_deadline, matters(matter_number)")
      .in("status", ["pending", "in_progress"])
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("matters")
      .select("id, matter_number, title, status, practice_area")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Active Matters", value: matterCount ?? 0, href: "/matters" },
    { label: "Open Tasks", value: taskCount ?? 0, href: "/calendar" },
    { label: "Clients", value: clientCount ?? 0, href: "/clients" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Upcoming Deadlines</h3>
            <Link
              href="/calendar"
              className="text-sm font-medium text-brand-600 hover:text-brand-800"
            >
              View all
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {deadlines?.map((task) => {
              const overdue = new Date(task.due_date!) < new Date();
              return (
                <li key={task.id} className="flex items-center justify-between">
                  <span className="min-w-0 truncate text-gray-900">
                    {task.title}
                    {(task.matters as any)?.matter_number && (
                      <span className="ml-2 text-gray-400">
                        {(task.matters as any).matter_number}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    {task.is_sol_deadline && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                        SOL
                      </span>
                    )}
                    {task.is_court_date && (
                      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                        Court
                      </span>
                    )}
                    <span
                      className={overdue ? "font-medium text-red-600" : "text-gray-500"}
                    >
                      {new Date(task.due_date!).toLocaleDateString()}
                    </span>
                  </span>
                </li>
              );
            })}
            {(!deadlines || deadlines.length === 0) && (
              <li className="text-gray-500">No upcoming deadlines.</li>
            )}
          </ul>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Recent Matters</h3>
            <Link
              href="/matters"
              className="text-sm font-medium text-brand-600 hover:text-brand-800"
            >
              View all
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {recentMatters?.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <Link
                  href={`/matters/${m.id}`}
                  className="min-w-0 truncate text-brand-600 hover:underline"
                >
                  {m.matter_number} — {m.title}
                </Link>
                <span
                  className={`ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    m.status === "open"
                      ? "bg-green-100 text-green-800"
                      : m.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.status}
                </span>
              </li>
            ))}
            {(!recentMatters || recentMatters.length === 0) && (
              <li className="text-gray-500">No matters yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
