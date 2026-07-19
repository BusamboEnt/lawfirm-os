import { ClientForm } from "../client-form";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <ClientForm />
      </div>
    </div>
  );
}
