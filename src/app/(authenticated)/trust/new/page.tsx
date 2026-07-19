import { TrustEntryForm } from "../trust-entry-form";

export default function NewTrustEntryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New Trust Ledger Entry</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <TrustEntryForm />
      </div>
    </div>
  );
}
