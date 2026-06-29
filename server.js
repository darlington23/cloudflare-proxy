const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.all('*', async (req, res) => {

    const targetUrl = `${req.url}`;

    try {
        // 3. Forward the request with clean browser headers
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // Forward original auth token if Bubble/Flutterflow passes one
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
            },
            data: req.body
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send({ error: 'Proxy error', message: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Dynamic proxy running on port ${PORT}`);
});
