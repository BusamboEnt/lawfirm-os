"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Member = {
  user_id: string;
  profiles: { full_name: string; role: string } | null;
};

type MatterClient = {
  client_id: string;
  clients: { name: string; email: string | null } | null;
};

export function MatterTeam({
  matterId,
  members,
  matterClients,
  canManage,
}: {
  matterId: string;
  members: Member[];
  matterClients: MatterClient[];
  canManage: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [allClients, setAllClients] = useState<{ id: string; name: string }[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [addClientId, setAddClientId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canManage) return;
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name")
      .then(({ data }) => {
        if (data) setAllUsers(data);
      });
    supabase
      .from("clients")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setAllClients(data);
      });
  }, [canManage]);

  async function addMember() {
    if (!addUserId) return;
    setError("");
    const { error: dbError } = await supabase
      .from("matter_members")
      .insert({ matter_id: matterId, user_id: addUserId });
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setAddUserId("");
    router.refresh();
  }

  async function removeMember(userId: string) {
    setError("");
    const { error: dbError } = await supabase
      .from("matter_members")
      .delete()
      .eq("matter_id", matterId)
      .eq("user_id", userId);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    router.refresh();
  }

  async function addClient() {
    if (!addClientId) return;
    setError("");
    const { error: dbError } = await supabase
      .from("matter_clients")
      .insert({ matter_id: matterId, client_id: addClientId });
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setAddClientId("");
    router.refresh();
  }

  async function removeClient(clientId: string) {
    setError("");
    const { error: dbError } = await supabase
      .from("matter_clients")
      .delete()
      .eq("matter_id", matterId)
      .eq("client_id", clientId);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    router.refresh();
  }

  const memberIds = new Set(members.map((m) => m.user_id));
  const clientIds = new Set(matterClients.map((c) => c.client_id));

  return (
    <>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="font-medium text-gray-900">Team</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between">
              <span className="text-gray-900">{m.profiles?.full_name}</span>
              <span className="flex items-center gap-2">
                <span className="capitalize text-gray-500">
                  {m.profiles?.role}
                </span>
                {canManage && (
                  <button
                    onClick={() => removeMember(m.user_id)}
                    className="text-xs text-red-500 hover:text-red-700"
                    title="Remove from matter"
                  >
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
          {members.length === 0 && (
            <li className="text-gray-500">No team members assigned.</li>
          )}
        </ul>
        {canManage && (
          <div className="mt-3 flex gap-2">
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Add team member...</option>
              {allUsers
                .filter((u) => !memberIds.has(u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
            </select>
            <button
              onClick={addMember}
              disabled={!addUserId}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="font-medium text-gray-900">Clients</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {matterClients.map((mc) => (
            <li key={mc.client_id} className="flex items-center justify-between">
              <span>
                <Link
                  href={`/clients/${mc.client_id}`}
                  className="text-brand-600 hover:underline"
                >
                  {mc.clients?.name}
                </Link>
                {mc.clients?.email && (
                  <span className="ml-2 text-gray-500">{mc.clients.email}</span>
                )}
              </span>
              {canManage && (
                <button
                  onClick={() => removeClient(mc.client_id)}
                  className="text-xs text-red-500 hover:text-red-700"
                  title="Unlink from matter"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
          {matterClients.length === 0 && (
            <li className="text-gray-500">No clients linked.</li>
          )}
        </ul>
        {canManage && (
          <div className="mt-3 flex gap-2">
            <select
              value={addClientId}
              onChange={(e) => setAddClientId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Link client...</option>
              {allClients
                .filter((c) => !clientIds.has(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <button
              onClick={addClient}
              disabled={!addClientId}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Link
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
