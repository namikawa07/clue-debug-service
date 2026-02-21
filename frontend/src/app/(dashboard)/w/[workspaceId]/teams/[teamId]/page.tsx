"use client";

import { useParams } from "next/navigation";

import { SpaceRedirect } from "@/components/space-redirect";
import { routes } from "@/lib/routes";

export default function Page() {
  const params = useParams();
  const teamId = params.teamId as string;

  return (
    <SpaceRedirect
      buildPath={(wid, sid) => routes.spaceTeam(wid, sid, teamId)}
    />
  );
}
