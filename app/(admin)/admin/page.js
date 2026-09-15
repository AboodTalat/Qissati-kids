import AdminApp from "@/components/admin/AdminApp";

/**
 * The dashboard is one client application behind a bearer token, not a set of
 * server-rendered routes.
 *
 * Every byte it displays comes from the qissati API with an `Authorization`
 * header, so there is nothing for the server to render before the operator has
 * signed in — a server component here could only render an empty shell and
 * then wait for the client anyway. Keeping it client-side also means the token
 * never travels to this app's server, which is a different machine from the
 * one that issued it.
 */
// Not `force-static`: `proxy.js` mints a per-request CSP nonce, and a nonce
// prerendered at build time would be the same one for every visitor — which
// is the same as having none. Nothing is lost: this page is an empty shell
// and already carries `Cache-Control: no-store`.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminApp />;
}
