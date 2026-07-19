"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TaskActions({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function setStatus(newStatus: string) {
    setBusy(true);
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    router.refresh();
    setBusy(false);
  }

  if (status === "completed") {
    return (
      <button
        onClick={() => setStatus("pending")}
        disabled={busy}
        className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        Reopen
      </button>
    );
  }

  return (
    <button
      onClick={() => setStatus("completed")}
      disabled={busy}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {busy ? "Saving..." : "Mark Complete"}
    </button>
  );
}
