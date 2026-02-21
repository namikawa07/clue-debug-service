import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { TeamsListClient } from "@/app/(dashboard)/workspaces/[workspaceId]/teams/client";

export default async function Page() {
  const user = await getCurrent();
  if (!user) redirect("/signin");
  return <TeamsListClient />;
}
