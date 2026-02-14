import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { SpacesListClient } from "./client";

const SpacesListPage = async () => {
  const user = await getCurrent();
  if (!user) {
    redirect("/signin");
  }
  return <SpacesListClient />;
};

export default SpacesListPage;

