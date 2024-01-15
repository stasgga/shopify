import { ActionFunction } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { fetchMarketingToken , handleTokenSubmit  } from './api'

export const action: ActionFunction = async ({ request }) => {
    const { topic, payload,admin,session } = await authenticate.webhook(request);
    
    const shopName = session.shop;

    const apiKeyRecord = await prisma.dealAiAppKey.findFirst({
     where: {
        shop: shopName,
      },
    });
  
    if (!apiKeyRecord) {
      throw new Error('API key not found for the shop');
    }
  
    const DealAIAPIKey = apiKeyRecord.key;



    if (topic === 'PRODUCTS_CREATE') {
        const globalProductId = payload.admin_graphql_api_id;
        const productId = payload.id; 
        const description = payload.body_html;
        const token = await fetchMarketingToken(description,DealAIAPIKey);
      if (token) {
            await handleTokenSubmit(token,DealAIAPIKey).then(response => {
              if (response && response.response && response.response.length > 0) {
                newDescription = response.response[0].product;
                console.log("Response received:", response);
              }              
            }).catch(error => {
                console.error('Error:', error);
          });
        }
        try {
           
          await admin?.graphql(
           `#graphql
           mutation productUpdate($input: ProductInput!) {
             productUpdate(input: $input) {
               product {
                 id                  
                 descriptionHtml
               }
             }
           }`,
           {
             variables: {
               input: {
                 id: globalProductId, 
                 
                 descriptionHtml: newDescription,
               }
             }
           }
         );
                   
     } catch (error) {
         console.error('Error updating product:', error);
         throw new Response('Error processing webhook', { status: 500 });
     }                                       



      
    } else {
        throw new Response('Unhandled webhook topic', { status: 404 });
    }

    return new Response(null, { status: 200 });
};
