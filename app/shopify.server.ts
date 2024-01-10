import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-10";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,

  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
    PRODUCTS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/ProductCreate",
    },
  },

  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    },
  },

  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;





/**
 * Updates a product's description in Shopify.
 * @param {string} productId - The ID of the product to update.
 * @param {string} description - The new description for the product.
 * @param {string} shop - The shop domain.
 * @returns {Promise} - A promise that resolves with the response from Shopify.
 */

export async function updateProductOnShopify(productId, description, shop) {
  try {
    console.log("Loading session for shop:", shop); // Debug log

    const session = await sessionStorage.loadSession(shop);

    // Check if the session and access token are available
    if (!session || !session.accessToken) {
      throw new Error(`Session or access token not found for shop ${shop}`);
    }

    const accessToken = session.accessToken;

    const url = `https://${shop}/admin/api/${apiVersion}/products/${productId}.json`;

    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    };

    const body = JSON.stringify({
      product: {
        id: productId,
        body_html: description
      }
    });

    // Send the request to update the product
    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: body
    });

    const data = await response.json();

    // Check if the response from Shopify is successful
    if (!response.ok) {
      throw new Error(`Error updating product: ${data.errors}`);
    }

    return data;

  } catch (error) {
    console.error('Failed to update product on Shopify:', error);
    throw error;
  }
}
