
import React, { useState, ChangeEvent } from 'react';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';

interface ResponseData {
  token: string;
}

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('inspiration');
  const [selectedValence, setSelectedValence] = useState<string>('positive');
  const [tokenValue, setTokenValue] = useState<string>(''); // New state for token input
  


  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleToneChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTone(event.target.value);
  };

  const handleValenceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedValence(event.target.value);
  };

  const handleTokenInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTokenValue(event.target.value);
  };

  const handleTokenSubmit = async () => {
    try {
      const resultResponse = await fetch(`https://api.test.marketing.deal.ai/api/2024-01/product/end/${tokenValue}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Deal-AI-API-Key': '6e064394d5f7b3aec7a4edc25f70ef35c9a1e3da464c8b5bf1c70d0416fd56c9',
        },
      });

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        setResponse(resultData);
        console.log('Result:', resultData);
      } else {
        console.error('Failed to fetch result');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('https://api.test.marketing.deal.ai/api/2024-01/product/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Deal-AI-API-Key': '6e064394d5f7b3aec7a4edc25f70ef35c9a1e3da464c8b5bf1c70d0416fd56c9',
        },
        body: JSON.stringify({
          tone: selectedTone,
          valence: selectedValence,
          businessDescription: inputValue,
          language: 'English',
          seoTags: [''],
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        setTokenValue(responseData.token); // Update token value in state
        console.log('successfully');
      } else {
        console.error('Failed to send data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        
      </head>
      <body>
      <div className="container mt-5"> 
          <div className="input-group mb-3"> 
            <h3>Business Description</h3>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter business description"
              className="form-control"
              />
          </div>
          <div className="input-group mb-3">
          <label htmlFor="tone" className="form-label">Select Tone:</label>
          <select
              id="tone"
              value={selectedTone}
              onChange={handleToneChange}
              className="form-select" 
            >
              <option value="inspiration">Inspiration</option>

              <option value="factual">Factual</option>
             <option value="fun">Fun</option>
              <option value="urgent">Urgent</option>
               <option value="fearbased">Fear-based</option>
            </select>
          </div>

          <div className="input-group mb-3">
          <label htmlFor="valence" className="form-label">Select Valence:</label>
            <select
              id="valence"
              value={selectedValence}
              onChange={handleValenceChange}
              className="form-select" 
            >
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit}>Submit</button> 
          

          {/* Token Input */}
          <div className="input-group mt-3">
            <h3>Token Input</h3>
            <input
              type="text"
              value={tokenValue}
              onChange={handleTokenInputChange}
              placeholder="Enter token"
              className="form-control" 
            />
            <button className="btn btn-primary ms-2" 
            onClick={handleTokenSubmit}
            disabled={!tokenValue} // Disable the button if tokenValue is empty
            >
            Submit Token
            </button> 
        
          </div>

          {response && (
            <div>
              <h2>Response:</h2>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
        <Outlet />
        <ScrollRestoration />
        <LiveReload />
        <Scripts />
      </body>
    </html>
  );
};

export default App;

