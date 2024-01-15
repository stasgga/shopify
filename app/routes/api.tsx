
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


const Redis = require('ioredis');


const redis = new Redis({
  password: 'cab9ZPs3e1lQXxwA323PAHW8EtkwRfG9',
  host: 'redis-16767.c274.us-east-1-3.ec2.cloud.redislabs.com',
  port: '16767',
});

redis.subscribe('createProductQueue', (error) => {
  if (error) {
    // handle subscription error
  }
 
});

redis.on('message', (channel, message) => {
  if (channel == 'createProductQueue'){
    console.log("Message received in subscription", message);
  }
  console.log(`Received message from ${channel}: ${message}`);
  // Handle the message
});

/* 
Shopify Webook called to server with (Payload) ------------------>
		/produt-updates with (Payload)
			Call Deal AI Start API with (Payload)
				Add token in (Payload)
				redis.publish('createProductChannel', JSON.stringify((Payload)));
				
				
				
				


redis.subscribe('createProductChannel', (error) => {
  if (error) {
    // handle subscription error
  }
 
});


redis.on('message', (channel, message) => {
  if (channel == 'createProductQueue'){
  
	call Deal AI Queue API with (message)
	if(token is still in progress){
		wait for 5 second
		redis.publish('createProductQueue', message);
	} else {
		call Deal AI end API
		get data from API
		call Shopify Product update function to update data from above API using payload
	}
    
  }
  console.log(`Received message from ${channel}: ${message}`);
  // Handle the message
});


*/


// Publisher function to publish tokens to a channel
async function publishProductCreate(token) {
  try {
    await redis.publish('createProductQueue', token);
    console.log('Token published to channel');
  } catch (error) {
    console.error('Error publishing token:', error);
    throw error;
  }
}



// Subscriber function to handle tokens
async function handleTokenSubmit(DealAIAPIKey) {
  try {
    redis.subscribe('createProductChannel', async (error, count) => {
      if (error) {
        throw error;
      }
      console.log(`Subscribed to ${count} channel. Listening for updates on the tokenChannel.`);
    });

    redis.on('message', async (channel, token) => {
      console.log(`Received message from ${channel}: ${token}`);

      // Process the token
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

      if (!queryResponse.ok) {
        console.error('Failed to fetch query result');
        throw new Error('Network response was not ok during query.');
      }

      const queryResponseData = await queryResponse.json();
      console.log('Query response:', queryResponseData);

      if (queryResponseData.status !== 'completed') {
        // Re-publish token for later processing
        publishProductCreate(token);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
      } else {
        // Process the completed token
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
      }
    });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}



export { fetchMarketingToken, handleTokenSubmit };
