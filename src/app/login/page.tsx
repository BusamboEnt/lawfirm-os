import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Law Firm OS</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your practice management account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
