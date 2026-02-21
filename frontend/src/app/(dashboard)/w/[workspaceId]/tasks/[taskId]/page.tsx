"use client";

import { useParams } from "next/navigation";

import { SpaceRedirect } from "@/components/space-redirect";
import { routes } from "@/lib/routes";

export default function Page() {
  const params = useParams();
  const taskId = params.taskId as string;

  return (
    <SpaceRedirect
      buildPath={(wid, sid) => routes.spaceTask(wid, sid, taskId)}
    />
  );
}
