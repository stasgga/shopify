async function fetchMarketingToken(description, DealAIAPIKey) {
  let token = '';
  try {
    const marketingResponse = await fetch(
      'https://api.test.marketing.deal.ai/api/2024-01/product/start',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Deal-AI-API-Key': DealAIAPIKey,
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
  } catch (error) {
    console.error('Error calling marketing API:', error);
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

async function endDealAI(token, DealAIAPIKey) {
  // Second API call
  const endResponse = await fetch(
    `https://api.test.marketing.deal.ai/api/2024-01/product/end/${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Deal-AI-API-Key': DealAIAPIKey,
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


async function queryDealAI(token, DealAIAPIKey) {
  try {
    const queryResponse = await fetch(
      `https://api.test.marketing.deal.ai/api/2024-01/product/query/${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Deal-AI-API-Key': DealAIAPIKey,
        },
      }
    );

    return queryResponse.json();

   
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}






export { fetchMarketingToken, updateProductDescription, queryDealAI, endDealAI };

