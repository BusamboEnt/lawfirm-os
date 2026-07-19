"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DocumentActions({
  documentId,
  matterId,
  filePath,
  fileName,
}: {
  documentId: string;
  matterId: string;
  filePath: string;
  fileName: string;
}) {
  const supabase = createClient();
  const [error, setError] = useState("");

  async function open(download: boolean) {
    setError("");
    const { data, error: urlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 300, download ? { download: fileName } : {});
    if (urlError || !data?.signedUrl) {
      setError(urlError?.message ?? "Could not open file.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("document_access_log").insert({
        document_id: documentId,
        matter_id: matterId,
        file_name: fileName,
        action: download ? "download" : "view",
        accessed_by: user.id,
      });
    }

    window.open(data.signedUrl, "_blank");
  }

  return (
    <span className="flex items-center gap-3 whitespace-nowrap">
      <button
        onClick={() => open(false)}
        className="text-sm font-medium text-brand-600 hover:text-brand-800"
      >
        View
      </button>
      <button
        onClick={() => open(true)}
        className="text-sm font-medium text-brand-600 hover:text-brand-800"
      >
        Download
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
