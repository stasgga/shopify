
import React, { useEffect, useState } from 'react';
import { json, ActionFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useSubmit, useLoaderData, Form } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Banner,
  Box,
  BlockStack,   
  Text

} from '@shopify/polaris';
import prisma from '../db.server';
import { authenticate } from '../shopify.server';


export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const shopName = session?.shop;

    if (shopName) {
      const existingKey = await prisma.dealAiAppKey.findUnique({
        where: { shop: shopName },
      });
      return json({ apiKey: existingKey?.key || '' });
    }

    return json({ apiKey: '' });
  } catch (error) {

    return json({ error: 'Authentication failed' }, { status: 401 });
  }
}


export const action: ActionFunction = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shopName = session.shop;
    const formData = await request.formData();
    const apiKey = formData.get('apiKey');
    const reset = formData.get('reset');

    if (reset) {
      // Handle reset
      await prisma.dealAiAppKey.delete({
        where: { shop: shopName },
      });
      return json({ reset: true });
    } else if (apiKey && shopName) {
      // Handle API key submission
      await prisma.dealAiAppKey.create({
        data: {
          key: apiKey,
          shop: shopName,
        },
      });
      return json({ apiKey });
    }
    return json({});
  } catch (error) {
    return json({ error: 'Authentication failed' }, { status: 401 });
  }
};

export default function ApiKeyPage() {
  const submit = useSubmit();
  const { apiKey } = useLoaderData();
  const [key, setKey] = useState(apiKey || '');

  useEffect(() => {
    setKey(apiKey || '');
  }, [apiKey]);

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(new FormData(event.currentTarget), { method: 'post' });
  };

  const handleReset = () => {
    const formData = new FormData();
    formData.append('reset', 'true');
    setKey('');
    submit(formData, { method: 'post', replace: true });
  };

  return (
    <Page>
      <div>Title: Deal AI Settings</div>
      <Layout>
        <Layout.Section oneHalf>
          <Card sectioned>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontWeight: 'bold' }}>API Key Configuration</h1>
            </div>
            {apiKey ? (
              <Banner title="Secure your app with an API key." status="info">
                <p>If someone else has become aware of your key, you should change it immediately using the button below. You will then need to visit your integrations and replace with the new API key.</p>
              </Banner>
            ) : (
              <Banner title="Secure your app with an API key." status="info">

                <p>Your API key allows you to integrate deal.ai apps with other services. Currently, API integration is in testing, we will announce integrations as they are ready. Use the Copy button to add the key to the right places in the integration.</p>
              </Banner>

            )}
            <div style={{ marginTop: '20px' }}>
              {apiKey ? (
                <Button size="large" variant='primary' tone="critical" onClick={handleReset}>Change API Key</Button>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <TextField                        
                    type="text"
                    value={key}
                    onChange={(newValue) => setKey(newValue)}
                    placeholder="Enter your API key here"
                    name="apiKey"
                  />
                  <div style={{ marginTop: '20px' }}>
                    <Button size="large" submit>Save</Button>
                  </div>
                </Form>
              )}
            </div>
          </Card>
        </Layout.Section>
        
        
        
        <Layout.Section>

          <Card roundedAbove="sm">
            <Text as="h2" variant="headingSm">
              Additional Settings
            </Text>
            <Box paddingBlock="200">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Configure additional settings for your Deal AI app here.
                </Text>
              </BlockStack>
            </Box>

          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
