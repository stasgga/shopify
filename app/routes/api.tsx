

async function fetchMarketingToken(description, dealAiAppKey) {
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
      console.error(`Failed to get token from marketing API: Status ${marketingResponse.status}`);
    }
  } catch (error) {
    console.error('Error calling marketing API:', error);
  }
  return token;
}


async function updateProductDescription(params) {
  const { shopifyStoreUrl, shopifyAccessToken, productId, productDescription } = params;
  const apiUrl = `${shopifyStoreUrl}/admin/api/2023-10/products/${productId}.json`;

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken,
      },
      body: JSON.stringify({ product: { body_html: productDescription } }),
    });

    if (!response.ok) {
      console.error(`Failed to update product: Status ${response.status}`);
      throw new Error('Failed to update product');
    }

    const data = await response.json();
    console.log('Product updated successfully:', data.product);
  } catch (error) {
    console.error('Error updating product:', error);
  }
}


async function endDealAI(token, dealAiAppKey) {
  try {
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
      console.error(`Failed to fetch end result: Status ${endResponse.status}`);
      throw new Error('Network response was not ok during end.');
    }

    const endResponseData = await endResponse.json();
    console.log('End response:', endResponseData);
    return endResponseData;
  } catch (error) {
    console.error('Error in endDealAI:', error);
    throw error;
  }
}



async function queryDealAI(token, dealAiAppKey, maxRetries = 5) {
  let retries = 0;
  let backoff = 1000; // Initial backoff duration in milliseconds

  while (retries < maxRetries) {
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

      if (!queryResponse.ok) {
        throw new Error(`API Response not OK: Status ${queryResponse.status}`);
      }

      // Handling rate limit headers
      const rateLimitRemaining = queryResponse.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = queryResponse.headers.get('X-RateLimit-Reset');

      if (rateLimitRemaining && rateLimitRemaining === '0' && rateLimitReset) {
        const currentTime = Date.now();
        const resetTime = new Date(rateLimitReset).getTime();
        backoff = Math.max(resetTime - currentTime, 1000); // Ensure at least 1 second backoff
        throw new Error('Rate limit exceeded, retrying with backoff');
      }

      return queryResponse.json();
    } catch (error) {
      console.error('Error:', error);

      retries++;
      if (retries >= maxRetries) {
        throw new Error('Max retries reached');
      }

      // Wait for the backoff duration before retrying
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff *= 2; // Exponential increase for next iteration
    }
  }
}







export { fetchMarketingToken, updateProductDescription, queryDealAI, endDealAI };

