require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const usersRoutes = require("./src/routes/usersRoutes");
const clientsRoutes = require("./src/routes/clientsRoutes");
const websitesRoutes = require("./src/routes/websitesRoutes");

const corsOptions = require("./src/config/cors");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", usersRoutes);
app.use("/api", clientsRoutes);
app.use("/api", websitesRoutes);

app.get("/api/status", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
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
