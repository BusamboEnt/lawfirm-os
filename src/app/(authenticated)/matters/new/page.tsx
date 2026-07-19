import { MatterForm } from "../matter-form";

export default function NewMatterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New Matter</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <MatterForm />
      </div>
    </div>
  );
}
