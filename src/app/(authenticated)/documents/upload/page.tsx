import { Suspense } from "react";
import { UploadForm } from "../upload-form";

export default function UploadDocumentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <Suspense>
          <UploadForm />
        </Suspense>
      </div>
    </div>
  );
}
