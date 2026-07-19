import { TimeEntryForm } from "../time-entry-form";

export default function NewTimeEntryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New Time Entry</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <TimeEntryForm />
      </div>
    </div>
  );
}
