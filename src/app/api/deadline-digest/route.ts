import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Sends each user an email digest of their tasks due within the next 7 days.
// Invoked by Vercel Cron (see vercel.json) or manually:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/deadline-digest
//
// Requires: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM.
// CRON_SECRET is optional but strongly recommended in production.

export const dynamic = "force-dynamic";

type TaskRow = {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  is_court_date: boolean;
  is_sol_deadline: boolean;
  matters: { matter_number: string; title: string } | null;
  profiles: { email: string; full_name: string; is_active: boolean } | null;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!supabaseUrl || !serviceKey || !resendKey || !from) {
    return NextResponse.json(
      {
        error:
          "Not configured. Set SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, and EMAIL_FROM.",
      },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, due_date, priority, is_court_date, is_sol_deadline, matters(matter_number, title), profiles!tasks_assigned_to_fkey(email, full_name, is_active)"
    )
    .in("status", ["pending", "in_progress"])
    .not("due_date", "is", null)
    .not("assigned_to", "is", null)
    .lte("due_date", horizon.toISOString())
    .order("due_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tasks = (data as unknown as TaskRow[]) ?? [];
  const byEmail = new Map<string, { name: string; tasks: TaskRow[] }>();
  for (const task of tasks) {
    const email = task.profiles?.email;
    if (!email || task.profiles?.is_active === false) continue;
    if (!byEmail.has(email)) {
      byEmail.set(email, { name: task.profiles!.full_name, tasks: [] });
    }
    byEmail.get(email)!.tasks.push(task);
  }

  let sent = 0;
  const failures: string[] = [];

  for (const [email, { name, tasks: userTasks }] of byEmail) {
    const lines = userTasks
      .map((t) => {
        const due = new Date(t.due_date);
        const overdue = due < new Date();
        const flags = [
          t.is_sol_deadline ? "SOL DEADLINE" : null,
          t.is_court_date ? "Court Date" : null,
          overdue ? "OVERDUE" : null,
        ]
          .filter(Boolean)
          .join(", ");
        const matter = t.matters
          ? ` (${t.matters.matter_number} — ${t.matters.title})`
          : "";
        return `<li><strong>${due.toLocaleDateString()}</strong> — ${t.title}${matter}${
          flags ? ` <em>[${flags}]</em>` : ""
        }</li>`;
      })
      .join("");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `Deadline digest: ${userTasks.length} item${
          userTasks.length === 1 ? "" : "s"
        } due within 7 days`,
        html: `<p>Hi ${name},</p><p>The following deadlines are coming up in the next 7 days:</p><ul>${lines}</ul><p>— Law Firm OS</p>`,
      }),
    });

    if (res.ok) sent += 1;
    else failures.push(`${email}: ${res.status}`);
  }

  return NextResponse.json({
    tasks_found: tasks.length,
    recipients: byEmail.size,
    emails_sent: sent,
    failures,
  });
}
