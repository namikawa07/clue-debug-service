import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { SpaceSettingsClient } from "@/app/(dashboard)/workspaces/[workspaceId]/spaces/[spaceId]/settings/client";

export default async function Page() {
  const user = await getCurrent();
  if (!user) redirect("/signin");
  return <SpaceSettingsClient />;
}
