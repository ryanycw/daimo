import { AppRouter } from "@daimo/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

import { chainConfig, envVarsWeb } from "../env";

const apiUrl = envVarsWeb.NEXT_PUBLIC_DAIMO_API_URL || "http://localhost:3000";
export const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;
console.log(`[RPC] using API URL: ${apiUrlWithChain}`);

export const rpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});
