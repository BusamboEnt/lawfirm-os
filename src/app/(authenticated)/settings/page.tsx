import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserTable } from "./user-table";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "partner" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, bar_number, is_active")
    .order("full_name");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Firm Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage user roles and access. New users appear here after they sign up.
      </p>

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Users
        </h2>
        <div className="mt-2">
          <UserTable users={users ?? []} currentUserId={user!.id} />
        </div>
      </div>
    </div>
  );
}
