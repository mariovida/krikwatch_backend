require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
var https = require("follow-redirects").https;

const authRoutes = require("./src/routes/authRoutes");
const usersRoutes = require("./src/routes/usersRoutes");
const clientsRoutes = require("./src/routes/clientsRoutes");
const websitesRoutes = require("./src/routes/websitesRoutes");
const contactsRoutes = require("./src/routes/contactsRoutes");
const incidentsRoutes = require("./src/routes/incidentsRoutes");
const calendarRoutes = require("./src/routes/calendarRoutes");
const templatesRoutes = require("./src/routes/templatesRoutes");

const corsOptions = require("./src/config/cors");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", usersRoutes);
app.use("/api", clientsRoutes);
app.use("/api", websitesRoutes);
app.use("/api", contactsRoutes);
app.use("/api", incidentsRoutes);
app.use("/api", calendarRoutes);
app.use("/api", templatesRoutes);

// UptimeRobot Endpoint
app.post("/api/uptimerobot", async (req, res) => {
  try {
    const apiUrl = "https://api.uptimerobot.com/v2/getMonitors";

    const response = await axios.post(apiUrl, {
      api_key: process.env.UPTIMEROBOT_API_KEY,
      format: "json",
      logs: "1",
    });

    const monitors = response.data.monitors;

    const websitesUp = monitors.filter(
      (monitor) => monitor.status === 2
    ).length;
    const websitesDown = monitors.filter(
      (monitor) => monitor.status !== 2
    ).length;

    //console.log(`Number of websites up: ${websitesUp}`);
    //console.log(`Number of websites down: ${websitesDown}`);

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching UptimeRobot data:", error.message);
    res.status(500).json({ message: "Failed to fetch data from UptimeRobot" });
  }
});

app.get("/api/status", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

const sendSMS = (to, from, text) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      hostname: "2m14wm.api.infobip.com",
      path: "/sms/2/text/advanced",
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      maxRedirects: 20,
    };

    const postData = JSON.stringify({
      messages: [
        {
          destinations: [{ to: to }],
          from: from,
          text: text,
        },
      ],
    });

    const req = https.request(options, (res) => {
      let chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const body = Buffer.concat(chunks);
        resolve(JSON.parse(body.toString()));
      });

      res.on("error", (error) => {
        reject(error);
      });
    });

    req.write(postData);
    req.end();
  });
};

app.post("/api/send-sms", async (req, res) => {
  const { to, from, text } = req.body;

  if (!to || !from || !text) {
    return res.status(400).json({
      message: "Missing required parameters: 'to', 'from', or 'text'.",
    });
  }

  try {
    const response = await sendSMS(to, from, text);
    res.status(200).json({
      message: "SMS sent successfully",
      response: response,
    });
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    res
      .status(500)
      .json({ message: "Failed to send SMS", error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
