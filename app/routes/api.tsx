import { apiVersion } from '../shopify.server';

async function fetchMarketingToken(description, dealAiAppKey) {
  let token = '';
  
    const marketingResponse = await fetch(
      'https://api.test.marketing.deal.ai/api/2024-01/product/start',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Deal-AI-API-Key': dealAiAppKey,
        },
        body: JSON.stringify({
          businessDescription: description,
          language: 'English',
          seoTags: [''],
        }),
      }
    );

    if (marketingResponse.ok) {
      const responseData = await marketingResponse.json();
      token = responseData.token;
      console.log('Token received:', token);
    } else {
      console.error('Failed to get token from marketing API');
    }
  
  return token;
}


async function updateProductDescription(params) {

  const { shopifyStoreUrl, shopifyAccessToken, productId, productDescription } = params;

  const apiUrl = `${shopifyStoreUrl}/admin/api/${apiVersion}/products/${productId}.json`;

  const shopifyHeaders = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': shopifyAccessToken,
  };

  const updatedProductData = {
    product: {
      body_html: productDescription,
    },
  };

  fetch(apiUrl, {
    method: 'PUT',
    headers: shopifyHeaders,
    body: JSON.stringify(updatedProductData),
  })
    .then((response) => {
      if (!response.ok) {
        console.log(response);
        throw new Error('Failed to update product');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Product updated successfully:', data.product);
    })
    .catch((error) => {
      console.error('Error updating product:', error);
    });
}

async function endDealAI(token, dealAiAppKey) {
  // Second API call
  const endResponse = await fetch(
    `https://api.test.marketing.deal.ai/api/2024-01/product/end/${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Deal-AI-API-Key': dealAiAppKey,
      },
    }
  );

  if (!endResponse.ok) {
    console.error('Failed to fetch end result');
    throw new Error('Network response was not ok during end.');
  }

  const endResponseData = await endResponse.json();
  console.log('End response:', endResponseData);
  return endResponseData; // Return the end response data
}


async function queryDealAI(token, dealAiAppKey) {
  
    const queryResponse = await fetch(
      `https://api.test.marketing.deal.ai/api/2024-01/product/query/${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Deal-AI-API-Key': dealAiAppKey,
        },
      }
    );

    console.log('Query Response', queryResponse);

    return queryResponse.json();

   
 
}






export { fetchMarketingToken, updateProductDescription, queryDealAI, endDealAI };

