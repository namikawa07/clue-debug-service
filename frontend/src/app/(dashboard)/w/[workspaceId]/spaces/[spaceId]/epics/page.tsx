import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { SpaceEpicsClient } from "./client";

export default async function Page() {
  const user = await getCurrent();
  if (!user) redirect("/signin");
  return <SpaceEpicsClient />;
}
