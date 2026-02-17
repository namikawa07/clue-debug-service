import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import { TeamsIdClient } from "./client";

const TeamsIdPage = async () => {
    const user = await getCurrent();
    if (!user) redirect("/sign-in");

    return <TeamsIdClient />;
};

export default TeamsIdPage;
