import AdminApp from "@/components/admin/AdminApp";

// The shared client shell keeps the validated bearer session across route
// changes. The PIN gate lives outside this group and never loads the shell.
export default function DashboardLayout({ children }) {
  return <AdminApp>{children}</AdminApp>;
}
