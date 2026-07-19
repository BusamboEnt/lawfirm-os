"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Matters", href: "/matters" },
  { name: "Clients", href: "/clients" },
  { name: "Conflict Check", href: "/conflicts" },
  { name: "Documents", href: "/documents" },
  { name: "Calendar", href: "/calendar" },
  { name: "Billing", href: "/billing" },
  { name: "Trust Ledger", href: "/trust" },
  { name: "Settings", href: "/settings" },
];

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <h2 className="text-lg font-bold text-white">Law Firm OS</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="text-sm text-gray-300">
          <p className="font-medium text-white">{user?.full_name}</p>
          <p className="text-xs capitalize text-gray-400">{user?.role}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 w-full rounded-md bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
