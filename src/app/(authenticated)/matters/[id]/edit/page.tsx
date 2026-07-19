import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatterForm } from "../../matter-form";

export default async function EditMatterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: matter } = await supabase
    .from("matters")
    .select("id, matter_number, title, status, practice_area, description")
    .eq("id", id)
    .single();

  if (!matter) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Edit Matter</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <MatterForm matter={matter} />
      </div>
    </div>
  );
}
