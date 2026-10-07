"use client";

import Link from "next/link";
import AccountView from "./AccountView";
import SettingsView from "./SettingsView";
import UsersView from "./UsersView";
import { useAdminSession } from "./AdminApp";

function AdminOnly({ children }) {
  const { me } = useAdminSession();
  if (me?.role === "admin") return children;
  return (
    <p className="text-sm text-muted">
      ما عندكم صلاحية لهالصفحة. <Link href="/admin" className="font-bold text-brand-deep underline">ارجعوا للطلبات</Link>
    </p>
  );
}

export function SettingsPage() {
  const { token } = useAdminSession();
  return <AdminOnly><SettingsView token={token} /></AdminOnly>;
}

export function UsersPage() {
  const { token, me } = useAdminSession();
  return <AdminOnly><UsersView token={token} me={me} /></AdminOnly>;
}

export function AccountPage() {
  const { token, me, refreshToken } = useAdminSession();
  return <AccountView token={token} me={me} onTokenRefresh={refreshToken} />;
}
