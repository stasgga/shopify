import { ActionFunction } from '@remix-run/node';
import { authenticate } from '~/shopify.server';

export const action: ActionFunction = async ({ request }) => {
    const { topic, payload } = await authenticate.webhook(request);

    if (topic === 'PRODUCTS_CREATE') {
        // Extract details from the payload
        const productId = payload.id;
        const newDescription = "Hi I am Ali :)";
        console.log(productId);
        console.log(newDescription);
        console.log(global.prisma);

        // Set up Shopify credentials
    const shopifyDomain = 'quickstart-de06169f.myshopify.com'; // Replace with your shop's domain
    const accessToken = 'shpua_9064dd089e62afa687393e4c036dd74c'; // Replace with your access token

    try {
        // Make the API request to update the product
        const response = await fetch(`https://${shopifyDomain}/admin/api/2022-04/products/${productId}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            },
            body: JSON.stringify({
                product: {
                    id: productId,
                    body_html: newDescription,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Product updated:', responseData);

        return new Response(null, { status: 200 });
    } catch (error) {
        console.error('Failed to update product:', error);
        return new Response('Failed to update product', { status: 500 });
    }
    } else {
        throw new Response('Unhandled webhook topic', { status: 404 });
    }

    return new Response(null, { status: 200 });
};
