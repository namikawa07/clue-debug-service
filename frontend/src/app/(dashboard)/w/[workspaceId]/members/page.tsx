"use client";

import { SpaceRedirect } from "@/components/space-redirect";
import { routes } from "@/lib/routes";

export default function Page() {
  return <SpaceRedirect buildPath={(wid, sid) => routes.space(wid, sid)} />;
}
