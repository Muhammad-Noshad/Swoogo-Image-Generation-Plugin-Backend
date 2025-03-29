require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
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

    const accessToken = tokenResponse?.data?.access_token;
    res.json({tokenResponse, accessToken});
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch token", details: error });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
