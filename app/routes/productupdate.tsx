import { ActionFunction } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { fetchMarketingToken, updateProductDescription, queryDealAI, endDealAI, logError } from './api';
import prisma from "../db.server";
const Redis = require('ioredis');

// Configure Redis subscriber
const subscriber = new Redis({
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

subscriber.subscribe('createProductQueue');

export const action: ActionFunction = async ({ request }) => {
  const { topic, payload, session } = await authenticate.webhook(request);
  payload.shopName = session.shop;
  try {
   
    if (topic !== 'PRODUCTS_CREATE') return new Response(null, { status: 200 });

    const apiKeyRecord = await prisma.dealAiAppKey.findFirst({
      where: { shop: session.shop },
    });

    if (!apiKeyRecord) throw new Error('API key not found for the shop.');

    const DealAIAPIKey = apiKeyRecord.key;
    payload.DealAIAPIKey = DealAIAPIKey;
    payload.shopifyAccessToken = session.accessToken;
    

    const token = await fetchMarketingToken(payload.body_html, DealAIAPIKey,payload.id, payload.shopName);
    if (token) {
      payload.dealAIToken = token;
      const publisher = new Redis({
        password: process.env.REDIS_PASSWORD,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      });

      console.log("Publishing to createProductQueue...");
      publisher.publish('createProductQueue', JSON.stringify(payload));
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error in action function:', error);
    await logError(error, payload.id, payload.shopName);
    return new Response('Internal Server Error', { status: 500 });
  }
}

subscriber.on('message', async (channel, message) => {
  if (channel == 'createProductQueue') {
    try {
     
      const payload = JSON.parse(message); 
      console.log(`Processing message for product ID: ${payload.id}`);

      const productId = payload.id;
      const shopName = payload.shopName;
      const { DealAIAPIKey, dealAIToken } = payload;

      if (dealAIToken) {
        let response = await queryDealAI(dealAIToken, DealAIAPIKey,productId,shopName);
        if (!response || response.status !== 'completed') {
          console.log(`Requeuing message for product ID: ${payload.id}`);
          await new Promise(resolve => setTimeout(resolve, 5000));

          const publisher = new Redis({
            password: process.env.REDIS_PASSWORD,
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
          });

          console.log("PubSub Publisher");
          publisher.publish(channel, message);
          return;
        }

        response = await endDealAI(dealAIToken, DealAIAPIKey,productId,shopName);
        if (response && response.response && response.response.length > 0) {
          const productDescription = response.response[0].product;
          let pdo = { 
            shopifyStoreUrl: `https://${payload.shopName}`, 
            shopifyAccessToken: payload.shopifyAccessToken, 
            productId, 
            productDescription 
          };
          await updateProductDescription(pdo);
          console.log(`Product description updated for product ID: ${payload.id}`);
        }
      }
    } catch (error) {
      console.error('Error processing message from Redis:', error);     
      const payload = JSON.parse(message); 
      await logError(error, payload.id, payload.shopName);
    }
  }
});