import { useCallback, useEffect, useState } from "react";
import {
  reactExtension,
  useApi,
  AdminAction,
  Button,
  TextArea,
  Box,
} from "@shopify/ui-extensions-react/admin";

import { fetchMarketingToken, queryDealAI, endDealAI } from "../../../app/routes/api";
import { getProductDetails, updateProductDescription } from "./utils";


const TARGET = "admin.product-details.action.render";

export default reactExtension(TARGET, () => <App />);

function App() {
  const { close, data } = useApi(TARGET);
  const [productDescription, setProductDescription] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [countdown, setCountdown] = useState(180); // 3 minutes in seconds

  useEffect(() => {
    (async function fetchProductDetails() {
      const productDetails = await getProductDetails(data.selected[0].id);
      if (productDetails?.data?.product) {
        setProductDescription(productDetails.data.product.descriptionHtml);
      }
    })();
  }, [data.selected]);

  useEffect(() => {
    let interval;
    if (isLoading && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading, countdown]);

  fetchApiKey = async () => {
    const res = await fetch(`api/dealaikey`);


    if (!res.ok) {
      console.error('Failed to fetch API key', res.statusText);
      throw new Error('Failed to fetch API key');
    }

    const data = await res.json();

    // Assuming the API now returns an object with dealAiAppKey and shopName
    return { dealAiAppKey: data.dealAiAppKey, shopName: data.shopName };
  };

  const handleGenerateNewDescription = async () => {
    setIsLoading(true);
    setCountdown(180); // Reset countdown to 3 minutes

    const currentDescription = productDescription;

    const { dealAiAppKey, shopName } = await fetchApiKey();

    const productId = data.selected[0].id;


    const token = await fetchMarketingToken(currentDescription, dealAiAppKey, productId, shopName);

    let timeoutId = setTimeout(() => {
      setIsLoading(false);
      setTimer(null);
    }, 180000); // 3 minutes

    let response = await queryDealAI(token, dealAiAppKey, productId, shopName);

    // Loop until the status is 'completed' or time runs out
    while (response.status !== 'completed' && countdown > 0) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      response = await queryDealAI(token, dealAiAppKey, productId, shopName);
    }

    clearTimeout(timeoutId);
    setIsLoading(false);
    setTimer(null);

    if (response.status === 'completed') {
      response = await endDealAI(token, dealAiAppKey, productId, shopName);
      if (response && response.response && response.response.length > 0) {
        const newProductDescription = response.response[0].product;
        setNewDescription(newProductDescription);
      }
    }
  };

  const onSubmit = useCallback(async () => {
    await updateProductDescription(data.selected[0].id, newDescription);
    close();
  }, [newDescription, data.selected]);

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <AdminAction
      title="Update Product Description"
      primaryAction={<Button onPress={onSubmit}>Update</Button>}
      secondaryAction={<Button onPress={close}>Cancel</Button>}
    >
      <TextArea
        value={productDescription}
        label="Current Product Description"
        readOnly
      />



      <Button onPress={handleGenerateNewDescription} disabled={isLoading}>
        {isLoading ? `Generating... (${formatCountdown()})` : 'Generate New Description'}
      </Button>
      <Box paddingBlockStart="large">
        <TextArea
          value={newDescription}
          onChange={(val) => setNewDescription(val)}
          label="New Product Description"
        />
      </Box>
    </AdminAction>
  );
}
