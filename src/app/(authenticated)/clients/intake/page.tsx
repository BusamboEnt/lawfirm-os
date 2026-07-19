import { IntakeForm } from "./intake-form";

export default function IntakePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New Client Intake</h1>
      <p className="mt-1 text-sm text-gray-500">
        Structured intake with a built-in conflict check. The conflict search
        runs automatically before the client record is created.
      </p>
      <div className="mt-6 max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        <IntakeForm />
      </div>
    </div>
  );
}
