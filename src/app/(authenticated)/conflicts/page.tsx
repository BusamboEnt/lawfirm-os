import { ConflictSearch } from "./conflict-search";

export default function ConflictsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Conflict Check</h1>
      <p className="mt-1 text-sm text-gray-500">
        Search existing clients, adverse parties, and matters before opening a
        new engagement.
      </p>
      <div className="mt-6 max-w-3xl">
        <ConflictSearch />
      </div>
    </div>
  );
}
