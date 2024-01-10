import { ActionFunction } from '@remix-run/node';
import { authenticate, updateProductOnShopify } from '~/shopify.server';


export const action: ActionFunction = async ({ request }) => {
    const { topic, payload } = await authenticate.webhook(request);

    if (topic === 'PRODUCTS_CREATE') {
        // Extract details from the payload
        const productId = payload.id;
        const bodyHtml = payload.body_html;
        const shop = payload.admin_graphql_api_id;

        console.log(productId);
        console.log(bodyHtml);
        console.log(shop);

        try {
            const firstApiResponse = await sendFirstApiRequest(bodyHtml);

            // Extract token from first API response
            const token = firstApiResponse.token;

            // Send the token to the second API and get the response
            const finalResponse = await sendSecondApiRequest(token);

            // Update the product on Shopify with the final response data
            await updateProductOnShopify(productId, finalResponse.modifiedDescription, shop);

        } catch (error) {
            console.error('Error in webhook handling:', error);
            // Handle the error appropriately
        }
    } else {
        throw new Response('Unhandled webhook topic', { status: 404 });
    }

    return new Response(null, { status: 200 });
};
async function sendFirstApiRequest(description) {
    try {
        const fetch = (await import('node-fetch')).default; // Dynamically import fetch

        const response = await fetch('https://api.test.marketing.deal.ai/api/2024-01/product/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Deal-AI-API-Key': '6e064394d5f7b3aec7a4edc25f70ef35c9a1e3da464c8b5bf1c70d0416fd56c9',
            },
            body: JSON.stringify({
                tone: 'Inspirational',
                businessDescription: description,
                language: 'English',
                seoTags: [''], // Adjust this as necessary
            }),
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('First API response successful');
            return responseData;
        } else {
            throw new Error('Failed to send data to first API');
        }
    } catch (error) {
        console.error('Error in sendFirstApiRequest:', error);
        throw error; // Rethrow the error to be handled in the caller
    }
}

async function sendSecondApiRequest(token) {
    try {
        const fetch = (await import('node-fetch')).default; // Dynamically import fetch

        const resultResponse = await fetch(`https://api.test.marketing.deal.ai/api/2024-01/product/end/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Deal-AI-API-Key': '6e064394d5f7b3aec7a4edc25f70ef35c9a1e3da464c8b5bf1c70d0416fd56c9',
            },
        });

        if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            console.log('Second API response successful');
            return resultData;
        } else {
            throw new Error('Failed to fetch result from second API');
        }
    } catch (error) {
        console.error('Error in sendSecondApiRequest:', error);
        throw error; // Rethrow the error to be handled in the caller
    }
}




/*const SibApiV3Sdk = require('sib-api-v3-sdk');
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        var apiKey = defaultClient.authentications['api-key'];

        apiKey.apiKey = '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'; 
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        
        // Convert payload to a string for email content
        const payloadString = JSON.stringify(payload, null, 2); // Beautify the JSON string
        const sendSmtpEmail = {
            to: [{ email: 'aliasgersw@gmail.com', name: 'Recipient Name' }],
            sender: { email: 'aliasgersw@gmail.com', name: 'ali asger' },
            subject: 'New Product Created in Shopify',
            htmlContent: `<p>Hello,</p><p>New product created:</p><pre>${payloadString}</pre>`
        };

        try {
            await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
*/