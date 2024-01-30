import { useCallback, useEffect, useState } from "react";
import {
  reactExtension,
  useApi,
  TextField,
  AdminAction,
  Button,
  TextArea,
  Box,
} from "@shopify/ui-extensions-react/admin";
import { getIssues, updateIssues,getProductDetails,updateProductDescription } from "./utils";

const TARGET = "admin.product-details.action.render";

export default reactExtension(TARGET, () => <App />);

function App() {
  const { close, data, intents } = useApi(TARGET);
  const issueId = intents?.launchUrl
    ? new URL(intents?.launchUrl)?.searchParams?.get("issueId")
    : null;
  const [loading, setLoading] = useState(issueId ? true : false);
  const [issue, setIssue] = useState({ title: "", description: "" });
  const [allIssues, setAllIssues] = useState([]);
  const [formErrors, setFormErrors] = useState(null);
  const { title, description, id } = issue;
  const isEditing = id !== undefined;

  const [productDescription, setProductDescription] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    (async function fetchProductDetails() {
      // Fetch product details including description
      const productDetails = await getProductDetails(data.selected[0].id);
      if (productDetails && productDetails.data && productDetails.data.product) {
        console.log(`product des=${productDetails.data.product.descriptionHtml}`)
        setProductDescription(productDetails.data.product.descriptionHtml);
      }
    })();
  }, []);


 

  const generateId = () => {
    if (!allIssues.length) {
      return 0;
    }
    return allIssues[allIssues.length - 1].id + 1;
  };

  const validateForm = () => {
    setFormErrors({
      title: !Boolean(title),
      description: !Boolean(description),
    });
    return Boolean(title) && Boolean(description);
  };

  const onSubmit = useCallback(async () => {
    if (validateForm()) {
      const newIssues = [...allIssues];
      if (isEditing) {
        // Find the index of the issue that you're editing
        const editingIssueIndex = newIssues.findIndex(
          (listIssue) => listIssue.id == issue.id
        );
        // Overwrite that issue's title and description with the new ones
        newIssues[editingIssueIndex] = {
          ...issue,
          title,
          description,
        };
      } else {
        // Add a new issue at the end of the list
        newIssues.push({
          id: generateId(),
          title,
          description,
          completed: false,
        });
      }

      // Commit changes to the database
      await updateIssues(data.selected[0].id, newIssues);
      // Close the modal
      close();
    }
  }, [issue, setIssue, allIssues, title, description]);

  const handleGenerateNewDescription = () => {
    
    const generatedDescription = "This is the new generated product description.";
    updateProductDescription(data.selected[0].id, "This is the new generated product description.")
    setNewDescription(generatedDescription);
  };


  useEffect(() => {
    if (issueId) {
      // If opened from the block extension, you find the issue that's being edited
      const editingIssue = allIssues.find(({ id }) => `${id}` === issueId);
      if (editingIssue) {
        // Set the issue's ID in the state
        setIssue(editingIssue);
      }
    }
  }, [issueId, allIssues]);

  if (loading) {
    return <></>;
  }

  return (
    <AdminAction
      title={isEditing ? "Edit your issue" : "DealAI"}
      primaryAction={
        <Button onPress={onSubmit}>{isEditing ? "Save" : "Update"}</Button>
      }
      secondaryAction={<Button onPress={close}>Cancel</Button>}
    >
    <TextArea
        value={productDescription}
        label="Product Description"
        readOnly
      />
      <Button onPress={handleGenerateNewDescription}>Generate New Description</Button>
      <Box paddingBlockStart="large">
        <TextArea
          value={newDescription}
          onChange={(val) => setNewDescription(val)}
          label="New Product Description"
        />
      </Box>
      {/* <TextField
        value={title}
        error={formErrors?.title ? "Please enter a title" : undefined}
        onChange={(val) => setIssue((prev) => ({ ...prev, title: val }))}
        label="Title"
      />
      <Box paddingBlockStart="large">
        <TextArea
          value={description}
          error={
            formErrors?.description ? "Please enter a description" : undefined
          }
          onChange={(val) =>
            setIssue((prev) => ({ ...prev, description: val }))
          }
          label="Description"
        />
      </Box> */}
    </AdminAction>
  );
}
