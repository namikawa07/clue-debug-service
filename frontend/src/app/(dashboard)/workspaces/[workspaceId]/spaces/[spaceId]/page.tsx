import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { SpaceIdClient } from "./client";


const SpaceIdPage = async () => {
    const startTime = Date.now();
    console.log(`[SSR] [SpaceIdPage] Start: ${new Date().toISOString()}`);

    const user = await getCurrent();
    console.log(`[SSR] [SpaceIdPage] getCurrent completed in ${Date.now() - startTime}ms`);

    if (!user) {
        redirect("/signin");
    }

    const render = <SpaceIdClient />;
    console.log(`[SSR] [SpaceIdPage] Finish: ${new Date().toISOString()} (Total: ${Date.now() - startTime}ms)`);
    return render;
};

export default SpaceIdPage;