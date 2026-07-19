"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  bar_number: string | null;
  is_active: boolean;
};

const ROLES = ["partner", "associate", "paralegal", "admin"];

export function UserTable({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");

  async function updateRole(userId: string, role: string) {
    setError("");
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    router.refresh();
  }

  async function toggleActive(userId: string, isActive: boolean) {
    setError("");
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ is_active: !isActive })
      .eq("id", userId);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      {error && (
        <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Bar #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {u.full_name}
                {u.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {u.bar_number ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm">
                <select
                  value={u.role}
                  disabled={u.id === currentUserId}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm capitalize focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-sm">
                <button
                  onClick={() => toggleActive(u.id, u.is_active)}
                  disabled={u.id === currentUserId}
                  className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                    u.is_active
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  } disabled:cursor-not-allowed`}
                  title={
                    u.id === currentUserId
                      ? "You cannot deactivate yourself"
                      : u.is_active
                      ? "Click to deactivate"
                      : "Click to activate"
                  }
                >
                  {u.is_active ? "Active" : "Inactive"}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                No users.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
