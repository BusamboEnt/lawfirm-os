import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: matters } = await supabase
    .from("matter_clients")
    .select("*, matters(id, matter_number, title, status)")
    .eq("client_id", id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        <Link
          href={`/clients/${id}/edit`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="font-medium text-gray-900">Contact Information</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {client.email && (
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{client.email}</dd>
              </div>
            )}
            {client.phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{client.phone}</dd>
              </div>
            )}
            {client.company && (
              <div>
                <dt className="text-gray-500">Company</dt>
                <dd className="text-gray-900">{client.company}</dd>
              </div>
            )}
            {client.address && (
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="text-gray-900">{client.address}</dd>
              </div>
            )}
          </dl>
          {client.notes && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500">Notes</h4>
              <p className="mt-1 text-sm text-gray-900">{client.notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="font-medium text-gray-900">Linked Matters</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {matters?.map((mc) => (
              <li key={mc.matter_id} className="flex justify-between">
                <Link
                  href={`/matters/${mc.matter_id}`}
                  className="text-brand-600 hover:underline"
                >
                  {(mc.matters as any)?.matter_number} — {(mc.matters as any)?.title}
                </Link>
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    (mc.matters as any)?.status === "open"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {(mc.matters as any)?.status}
                </span>
              </li>
            ))}
            {(!matters || matters.length === 0) && (
              <li className="text-gray-500">No matters linked to this client.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
