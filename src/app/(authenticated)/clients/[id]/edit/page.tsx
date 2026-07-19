import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "../../client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, phone, address, company, notes")
    .eq("id", id)
    .single();

  if (!client) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <ClientForm client={client} />
      </div>
    </div>
  );
}
