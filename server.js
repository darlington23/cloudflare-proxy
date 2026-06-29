const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.all('*', async (req, res) => {
    // 1. Extract the dynamic target base URL from your custom header
    const targetBase = req.headers['x-target-url'];

    if (!targetBase) {
        return res.status(400).json({ 
            error: 'Missing Header', 
            message: 'You must provide the destination API base URL in the "X-Target-URL" header.' 
        });
    }

    // 2. Construct the full URL (e.g., https://api.provider.com + /api/v1/endpoint + ?param=1)
    const cleanBase = targetBase.replace(/\/$/, ''); // Remove trailing slash if present
    const targetUrl = `${cleanBase}${req.url}`;

    try {
        // 3. Conditionally build Axios config
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
            }
        };

        // ONLY attach data if it's a mutation request with an actual body
        if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) && Object.keys(req.body).length > 0) {
            axiosConfig.data = req.body;
        }

        const response = await axios(axiosConfig);
        res.status(response.status).json(response.data);

    } catch (error) {
        if (error.response) {
            // Forward the exact error payload from the target API to see what it complained about
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send({ error: 'Proxy error', message: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Dynamic proxy running on port ${PORT}`);
});
