import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, matters(title, matter_number)")
    .not("due_date", "is", null)
    .order("due_date", { ascending: true })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Calendar & Deadlines</h1>

      <div className="mt-6 space-y-4">
        {tasks?.map((task) => (
          <div
            key={task.id}
            className={`rounded-lg bg-white p-4 shadow-sm border-l-4 ${
              task.is_sol_deadline
                ? "border-red-500"
                : task.is_court_date
                ? "border-yellow-500"
                : "border-brand-500"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                {task.matters && (
                  <p className="text-sm text-gray-500">
                    {(task.matters as any).matter_number} — {(task.matters as any).title}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(task.due_date!).toLocaleDateString()}
                </p>
                <div className="mt-1 flex gap-1">
                  {task.is_court_date && (
                    <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Court Date
                    </span>
                  )}
                  {task.is_sol_deadline && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      SOL Deadline
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!tasks || tasks.length === 0) && (
          <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            No upcoming deadlines.
          </div>
        )}
      </div>
    </div>
  );
}
