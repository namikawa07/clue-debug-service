import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { EpicIdClient } from "@/app/(dashboard)/workspaces/[workspaceId]/spaces/[spaceId]/epics/[epicId]/client";

export default async function Page() {
  const user = await getCurrent();
  if (!user) redirect("/signin");
  return <EpicIdClient />;
}
