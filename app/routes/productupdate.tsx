import { ActionFunction } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { fetchMarketingToken, updateProductDescription, queryDealAI, endDealAI } from './api'
import prisma from "../db.server";

const Redis = require('ioredis');

function createRedisClient() {
  try {
    return new Redis({
      password: process.env.REDIS_PASSWORD,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
  } catch (error) {
    console.error('Error creating Redis client:', error);
    // Handle Redis connection error (e.g., retry logic, fallback)
  }
}



const subscriber = createRedisClient();
subscriber.subscribe('createProductQueue');


export const action: ActionFunction = async ({ request }) => {
  const { topic, payload, session } = await authenticate.webhook(request);

  const apiKeyRecord = await prisma.dealAiAppKey.findFirst({
    where: {
      shop: session.shop,
    },
  });
  if (!apiKeyRecord) {
    throw new Error('API key not found for the shop');
  }

  const DealAIAPIKey = apiKeyRecord.key;

  if (topic !== 'PRODUCTS_CREATE') {
    return;
  }

  payload.DealAIAPIKey = DealAIAPIKey;
  payload.shopifyAccessToken = session.accessToken;
  payload.shopName = session.shop;


  const token = await fetchMarketingToken(payload.body_html, DealAIAPIKey);

  if (token) {
    payload.dealAIToken = token;

    const publisher = createRedisClient();
    if (!publisher) {
      console.error('Failed to create Redis publisher');
      return new Response(null, { status: 500 }); // Indicate server error
    }

    console.log("Webhook Publisher");


   // Improved error handling for Redis publish
    try {
      await publisher.publish('createProductQueue', JSON.stringify(payload));
    } catch (publishError) {
      console.error('Error publishing to Redis:', publishError);
      // Handle publishing error (e.g., retry logic, fallback)
      return new Response(null, { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}

subscriber.on('message', async (channel, message) => {
  console.log(`Received message with ${channel} and ${message}`);

  if (channel == 'createProductQueue') {
    // Process the received message
    try {
      const payload = JSON.parse(message); // Assuming message is a JSON string
      const productId = payload.id;
      const { DealAIAPIKey, dealAIToken } = payload;

      

      if (dealAIToken) {
        let response = await queryDealAI(dealAIToken, DealAIAPIKey);
        console.log("Query Deal AI", response);

        if (!response || response.status !== 'completed') {
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

        response = await endDealAI(dealAIToken, DealAIAPIKey);

        if (response && response.response && response.response.length > 0) {
          const productDescription = response.response[0].product;
          // Update product description in Shopify
          const shopifyStoreUrl = `https://${payload.shopName}`;
          const shopifyAccessToken = payload.shopifyAccessToken;

          let pdo = { shopifyStoreUrl, shopifyAccessToken, productId, productDescription };
          await updateProductDescription(pdo);
        }
      }
    } catch (processError) {
      console.error('Error processing message from Redis:', processError);
      // Handle processing error
    }
  }
});