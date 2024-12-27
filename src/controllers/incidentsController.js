const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

// Create new incident
const createIncident = async (req, res) => {
  const { title, description, website_id } = req.body;
  console.log(req.body);
  return;

  if (!name) {
    return res.status(400).json({ message: "Name field is required." });
  }

  try {
    const [existingWebsite] = await db.query(
      "SELECT * FROM websites WHERE name = ?",
      [name]
    );

    if (existingWebsite.length > 0) {
      return res
        .status(200)
        .json({ message: "Website with this name already exists" });
    }

    const [result] = await db.query(
      `INSERT INTO websites 
        (name, status, client_id, created_at, website_url) 
        VALUES (?, 1, ?, NOW(), ?)`,
      [name, client_id, url]
    );

    res.status(201).json({
      message: "Website created successfully.",
      websiteId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating website:", error);
    return res.status(500).json({ message: "Error creating website." });
  }
};

module.exports = {
  createIncident,
};
