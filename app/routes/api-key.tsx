import { useEffect, useState } from 'react';
import { json } from '@remix-run/node';
import { useSubmit } from '@remix-run/react';
import { AppProvider, TextField, Button } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json'; 
import prisma from '../db.server'; 
import {ActionFunction} from '@remix-run/node';
import {authenticate} from '~/shopify.server';



function APIComponent() {
    const [apiKey, setApiKey] = useState('');
    const submit = useSubmit();

    const handleSubmit = (event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget), { method: 'post' });
    };

    const handleApiKeyChange = (newValue) => {
        setApiKey(newValue);
    };

    // Inside the return statement of your component...
    return (
        <AppProvider i18n={enTranslations}>
            <form onSubmit={handleSubmit}>
                <TextField 
                    label="Deal-AI-API-Key" 
                    name="apiKey" 
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    autoComplete="off"
                />
                <Button submit>Save API Key</Button>
            </form>
        </AppProvider>
    );
}

export default APIComponent;


export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const apiKey = formData.get('apiKey');

    const { session } = await authenticate.admin(request);
    const shopName = session.shop;
    
    try {
        if (shopName) {
            await prisma.DealAiAppKey.create({
                data: {
                    key: apiKey,
                    shop: shopName
                },
            });

            return json({ success: true });
        } else {
            return json({ error: 'Shop is undefined or null' }, { status: 400 });
        }
    } catch (error) {
        if (error.code === 'P2002') { 
            return json({ error: 'API key already exists for this shop' }, { status: 400 });
        } else {
            console.error('Error creating API key:', error);
            return json({ error: 'An unexpected error occurred' }, { status: 500 });
        }
    }
};
