import type { MetadataRoute } from "next";

// Search engines may index the public pages only.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/reservation/"] },
  };
}
