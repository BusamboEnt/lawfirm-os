import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DocumentActions } from "@/components/document-actions";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ matter?: string; q?: string }>;
}) {
  const { matter, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("documents")
    .select("*, matters(title, matter_number), profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (matter) query = query.eq("matter_id", matter);
  if (q) query = query.ilike("file_name", `%${q}%`);

  const { data: documents } = await query;

  const { data: filteredMatter } = matter
    ? await supabase
        .from("matters")
        .select("matter_number, title")
        .eq("id", matter)
        .single()
    : { data: null };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          {filteredMatter && (
            <p className="mt-1 text-sm text-gray-500">
              Case file: {filteredMatter.matter_number} — {filteredMatter.title}{" "}
              <Link href="/documents" className="text-brand-600 hover:underline">
                (show all)
              </Link>
            </p>
          )}
        </div>
        <Link
          href={matter ? `/documents/upload?matter=${matter}` : "/documents/upload"}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Upload Document
        </Link>
      </div>

      <form method="GET" className="mt-4 flex max-w-md gap-2">
        {matter && <input type="hidden" name="matter" value={matter} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by file name..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Search
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Matter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Uploaded By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {documents?.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {doc.file_name}
                  {doc.description && (
                    <p className="text-xs font-normal text-gray-500">
                      {doc.description}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <Link
                    href={`/documents?matter=${doc.matter_id}`}
                    className="hover:text-brand-600 hover:underline"
                  >
                    {(doc.matters as any)?.matter_number} —{" "}
                    {(doc.matters as any)?.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(doc.profiles as any)?.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  v{doc.version}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <DocumentActions
                    filePath={doc.file_path}
                    fileName={doc.file_name}
                  />
                </td>
              </tr>
            ))}
            {(!documents || documents.length === 0) && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
