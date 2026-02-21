import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { NotesClient } from "@/app/(dashboard)/workspaces/[workspaceId]/notes/client";

export default async function Page() {
  const user = await getCurrent();
  if (!user) redirect("/signin");
  return <NotesClient />;
}
