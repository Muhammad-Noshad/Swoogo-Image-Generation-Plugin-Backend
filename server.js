require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const extractToken = require("./middleware/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BASE64_CREDENTIALS = process.env.BASE64_CREDENTIALS;

app.get("/get-token", async (req, res) => {
  try {
    const base64Credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const response = await axios.post(
      "https://api.swoogo.com/api/v1/oauth2/token.json",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${base64Credentials}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token", details: error.response.data });
  }
});

app.get("/event/:id", extractToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const token = req.token;
    
    if(!eventId) {
      return res.status(400).json({
        error: "Event ID is required"
      });
    }
    // 244694
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/events/${eventId}.json`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event details", details: error.response.data });
  }
});

app.get("/registrants/:eventId", extractToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const token = req.token;
    
    if(!eventId) {
      return res.status(400).json({
        error: "Event ID is required"
      });
    }
    // 244694
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/registrants.json?event_id=${eventId}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registrant details", details: error.response.data });
  }
});

app.get("/registrant/:id", extractToken, async (req, res) => {
  try {
    const registrantId = req.params.id;
    const token = req.token;
    
    if(!registrantId) {
      return res.status(400).json({
        error: "Registrant ID is required"
      });
    }
    // 244694
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/registrants/${registrantId}.json`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registrant details", details: error.response.data });
  }
});

app.get("/image/:type/:id/:imageType", extractToken, async (req, res) => {
  try {
    const type = req.params.type;
    const id = req.params.id;
    const token = req.token;
    const imageType = req.params.imageType;

    if(!type) {
      return res.status(400).json({
        error: "Object Type is required"
      });
    }

    if(!id) {
      return res.status(400).json({
        error: "Object ID is required"
      });
    }

    if(!imageType) {
      return res.status(400).json({
        error: "Image Type is required"
      });
    }
    // TYPE: registrant
    // ID: 26361060
    const response = await axios.get(
      `https://api.swoogo.com/api/v1/image/${type}/${id}/${imageType}.json`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch images", details: error.response.data });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
