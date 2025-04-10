// server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

app.get("/", (req, res) => {
  res.send("The service is working fine");
});

// Proxy endpoint
app.get("/proxy-video", async (req, res) => {
  try {
    const videoUrl = req.query.url;

    console.log("video", videoUrl);

    if (!videoUrl) {
      return res.status(400).send("URL parameter is required");
    }

    // Forward the request to the target URL
    const response = await axios({
      method: "get",
      url: videoUrl,
      responseType: "stream",
      headers: {
        // Mimicking a browser request
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: new URL(videoUrl).origin,
      },
    });

    // Forward the response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Pipe the video stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).send("Error proxying the request");
  }
});

app.get("/api/anime", async (req, res) => {
  try {
    const page = req.query.page || 1;
    const response = await axios.get(`https://animeapi.skin/new?page=${page}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/episodes', async (req, res) => {
  try {
    const { title } = req.query;
    
    if (!title) {
      return res.status(400).json({ error: 'Title parameter is required' });
    }
    
    // Encode the title for the URL
    const encodedTitle = encodeURIComponent(title);
    
    // Make request to the external API
    const response = await axios.get(`https://animeapi.skin/episodes?title=${encodedTitle}`);
    
    // Return the data from the external API
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching anime episodes:', error.message);
    
    // Handle different error scenarios
    if (error.response) {
      // The external API responded with an error
      return res.status(error.response.status).json({
        error: 'Error from anime API',
        details: error.response.data
      });
    } else if (error.request) {
      // No response received from the external API
      return res.status(503).json({
        error: 'Unable to reach anime API service'
      });
    } else {
      // Something else went wrong
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
