require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const qs = require("qs");
const extractToken = require("./middleware/authMiddleware");

const app = express();
app.use(
  cors({
    origin: process.env.ORIGIN,
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());

const SW_CLIENT_ID = process.env.SW_CLIENT_ID;
const SW_CLIENT_SECRET = process.env.SW_CLIENT_SECRET;
const LI_CLIENT_ID = process.env.LI_CLIENT_ID;
const LI_CLIENT_SECRET = process.env.LI_CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;

app.get("/get-token", async (req, res) => {
  try {
    const base64Credentials = Buffer.from(
      `${SW_CLIENT_ID}:${SW_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      "https://api.swoogo.com/api/v1/oauth2/token.json",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${base64Credentials}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch token", details: error.response.data });
  }
});

app.get("/event/:id", extractToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const token = req.token;

    if (!eventId) {
      return res.status(400).json({
        error: "Event ID is required",
      });
    }
    // 244694
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/events/${eventId}.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch event details",
      details: error.response.data,
    });
  }
});

app.get("/registrants/:eventId", extractToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const token = req.token;

    if (!eventId) {
      return res.status(400).json({
        error: "Event ID is required",
      });
    }
    // 244694
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/registrants.json?event_id=${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch registrant details",
      details: error.response.data,
    });
  }
});

app.get("/registrant/:id", extractToken, async (req, res) => {
  try {
    const registrantId = req.params.id;
    const token = req.token;

    if (!registrantId) {
      return res.status(400).json({
        error: "Registrant ID is required",
      });
    }
    // 244694
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/registrants/${registrantId}.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch registrant details",
      details: error.response.data,
    });
  }
});

app.get("/image/:type/:id/:imageType", extractToken, async (req, res) => {
  try {
    const type = req.params.type;
    const id = req.params.id;
    const token = req.token;
    const imageType = req.params.imageType;

    if (!type) {
      return res.status(400).json({
        error: "Object Type is required",
      });
    }

    if (!id) {
      return res.status(400).json({
        error: "Object ID is required",
      });
    }

    if (!imageType) {
      return res.status(400).json({
        error: "Image Type is required",
      });
    }
    // TYPE: registrant
    // ID: 26361060
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/image/${type}/${id}/${imageType}.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch images", details: error.response.data });
  }
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URL,
        client_id: LI_CLIENT_ID,
        client_secret: LI_CLIENT_SECRET,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    
    res.redirect(`${process.env.ORIGIN}?token=${accessToken}`);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch token", details: error.response.data });
  }
});

app.get("/linkedin/user-id", async (req, res) => {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: "Missing accessToken" });
  }

  try {
    const profileResponse = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}`, "X-Restli-Protocol-Version": "2.0.0" },
    });

    const userId = profileResponse.data.id;
    res.json({ userId });
  } catch (error) {
    console.error("Failed to fetch LinkedIn user ID:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch user ID", details: error.response?.data || error.message });
  }
});

app.post("/linkedin/upload-image", async (req, res) => {
  const { accessToken, userId } = req.body;

  if (!accessToken || !userId) {
    return res.status(400).json({ error: "Missing accessToken or userId" });
  }

  try {
    const registerUrl = "https://api.linkedin.com/v2/assets?action=registerUpload";

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };

    const uploadRequestBody = {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${userId}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    };

    const response = await axios.post(registerUrl, uploadRequestBody, { headers });
    const uploadUrl = response.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const assetId = response.data.value.asset;

    res.json({ uploadUrl, assetId });
  } catch (error) {
    console.error("LinkedIn Image Upload Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to register image upload", details: error.response?.data || error.message });
  }
});

app.post("/linkedin/create-post", async (req, res) => {
  const { accessToken, text, assetId, userId } = req.body;

  if (!accessToken || !text || !assetId || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const postUrl = "https://api.linkedin.com/v2/ugcPosts";

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };

    const postBody = {
      author: `urn:li:person:${userId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: text,
          },
          // shareMediaCategory: "IMAGE",
          // media: [
          //   {
          //     status: "READY",
          //     description: { text: "An amazing image!" },
          //     media: assetId,
          //     title: { text: "My Image Post" },
          //   },
          // ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await axios.post(postUrl, postBody, { headers });

    res.json({ success: true, postResponse: response.data });
  } catch (error) {
    console.error("Error creating LinkedIn post:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create post", details: error.response?.data || error.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
