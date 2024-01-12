
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleTokenSubmit(token, DealAIAPIKey) {
  try {
    let resultData;
    let attempts = 1;
    const maxAttempts = 5;

    do {
      const resultResponse = await fetch(
        `https://api.test.marketing.deal.ai/api/2024-01/product/end/${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Deal-AI-API-Key': DealAIAPIKey,
          },
        }
      );

      if (resultResponse.ok) {
        resultData = await resultResponse.json();
        console.log('Attempt', attempts, ':', resultData);

        if (resultData.status === 'Still processing' && attempts < maxAttempts) {
          await delay(5000); // wait for 5 seconds before the next call
        }
      } else {
        console.error('Failed to fetch result');
        break; // Exit the loop if there's an error
      }

      attempts++;
    } while (
      resultData.status === 'Still processing' &&
      attempts <= maxAttempts
    );

    if (
      attempts === maxAttempts &&
      resultData.status === 'Still processing'
    ) {
      console.log('Reached maximum attempts. Last received status:', resultData);
    }
    return resultData; // Return the resultData
  } catch (error) {
    console.error('Error fetching result:', error);
    throw error; // Rethrow the error to be caught by the caller
  }
}

export { fetchMarketingToken, handleTokenSubmit };
