import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // The authenticate.admin method returns a CORS method to automatically wrap responses so that extensions, which are hosted on extensions.shopifycdn.com, can access this route.
  const { cors, session } = await authenticate.admin(request);

  const apiKeyRecord = await prisma.dealAiAppKey.findFirst({
    where: {
      shop: session.shop,
    },
  });

  if (!apiKeyRecord) {
    throw new Error('API key not found for the shop');
  }

  const DealAIAPIKey = apiKeyRecord.key;

  
  return cors(json({
    dealAiAppKey: DealAIAPIKey,
    shopName: session.shop
  }));
};

