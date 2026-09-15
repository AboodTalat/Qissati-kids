/**
 * The installable surface is the operator dashboard, not the public site.
 * This explicit route is linked only by the admin layout, so public landing
 * pages do not advertise an admin-only PWA to visitors or crawlers.
 */
export function GET() {
  return Response.json(
    {
      id: "/admin",
      name: "قصتي — لوحة التحكم",
      short_name: "قصتي",
      description: "إدارة طلبات قصتي واستقبال إشعارات الطلبات الجديدة.",
      start_url: "/admin",
      scope: "/",
      display: "standalone",
      background_color: "#fdf8f0",
      theme_color: "#146466",
      lang: "ar",
      dir: "rtl",
      icons: [
        {
          src: "/brand/logo-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/brand/logo-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "application/manifest+json; charset=utf-8",
      },
    },
  );
}
