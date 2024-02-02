import prisma from "../db.server";

async function fetchMarketingToken(description, dealAiAppKey,productId,shopName) {
  
  let token = '';
  try {
   
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
      console.error('Failed to get token from DealAI');
      throw new Error('Failed to get token from DealAI API');
    }
  } catch (error) {
    console.error('Error calling marketing API:', error);
    await logError(error, productId, shopName);
  }
  return token;
}


async function updateProductDescription(params) { 
  const { shopifyStoreUrl, shopifyAccessToken, productId, productDescription } = params;

  const apiUrl = `${shopifyStoreUrl}/admin/api/2023-10/products/${productId}.json`;

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
       
        throw new Error('Failed to update product');
      }
      return response.json();
    })
    .then((data) => {
      
      console.log('Product updated successfully');
    })
    .catch((error) => {
      console.error('Error updating product:', error);
      logError(error, productId, shopifyStoreUrl); 
    });
}

async function endDealAI(token, dealAiAppKey,productId,shopName) {
  
  try {   
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
  return endResponseData; 
} catch (error) {
  console.error('Error in endDealAI:', error);
  await logError(error, productId, shopName); 
  throw error;
}
}

async function queryDealAI(token, dealAiAppKey,productId,shopName) {
  try {
   
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

    return queryResponse.json();

   
  } catch (error) {
    console.error('Error:', error);
    await logError(error, productId, shopName); 
    throw error;

  }
}

async function logError(error, productId, shopName) {
  try {
    await prisma.ErrorLog.create({
      data: {
        productId: productId,
        shopName: shopName,
        stackTrace: error.stack,
        errorMessage: error.message,
        timestamp: new Date(), 
       },
    });
    console.error("Logged error to the database:", error.message);
  } catch (logError) {
    console.error("Failed to log error to the database:", logError.message);
  }
}
  

export { fetchMarketingToken, updateProductDescription, queryDealAI, endDealAI,logError};

