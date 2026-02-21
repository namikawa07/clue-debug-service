import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { EpicIdClient } from "./client";

const EpicIdPage = async () => {
    const user = await getCurrent();
    if (!user) redirect("/signin");
    return <EpicIdClient />;
};

export default EpicIdPage;
