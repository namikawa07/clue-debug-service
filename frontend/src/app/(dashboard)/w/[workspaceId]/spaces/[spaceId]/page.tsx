import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { SpaceIdClient } from "@/app/(dashboard)/workspaces/[workspaceId]/spaces/[spaceId]/client";

export default async function Page() {
  const user = await getCurrent();
  if (!user) redirect("/signin");
  return <SpaceIdClient />;
}
