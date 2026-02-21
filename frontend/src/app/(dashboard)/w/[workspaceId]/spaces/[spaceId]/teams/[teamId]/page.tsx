import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { TeamsIdClient } from "@/app/(dashboard)/workspaces/[workspaceId]/teams/[teamId]/client";

export default async function Page() {
  const user = await getCurrent();
  if (!user) redirect("/signin");
  return <TeamsIdClient />;
}
