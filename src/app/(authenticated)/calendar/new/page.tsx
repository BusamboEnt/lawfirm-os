import { TaskForm } from "../task-form";

export default function NewTaskPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New Task / Deadline</h1>
      <div className="mt-6 max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <TaskForm />
      </div>
    </div>
  );
}
