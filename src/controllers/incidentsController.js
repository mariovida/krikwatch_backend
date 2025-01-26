const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

const generateIncidentKey = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

// Fetch all incidents
const getIncidents = async (req, res) => {
  try {
    const [incidents] = await db.query(`
      SELECT 
        incidents.*, 
        websites.name AS website_name, 
        users.first_name AS created_by_first_name,
        users.last_name AS created_by_last_name
      FROM 
        incidents
      LEFT JOIN 
        websites 
      ON 
        incidents.website_id = websites.id
      LEFT JOIN 
        users 
      ON 
        incidents.created_by = users.id
      ORDER BY
        incidents.created_at DESC
    `);

    if (incidents.length === 0) {
      return res.status(404).json({ message: "No incidents found" });
    }

    return res.json({ incidents });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return res.status(500).json({ message: "Error fetching incidents" });
  }
};

// Create new incident
const createIncident = async (req, res) => {
  const {
    title,
    description,
    website_id,
    status,
    user_id,
    start_time,
    end_time,
  } = req.body;

  let statusCode;
  if (status === "OPEN") {
    statusCode = 1;
  } else if (status === "IN PROGRESS") {
    statusCode = 2;
  } else if (status === "RESOLVED") {
    statusCode = 3;
  } else {
    statusCode = 4;
  }

  if (!website_id || !title) {
    return res
      .status(400)
      .json({ message: "Title and website ID are required." });
  }

  const incidentKey = generateIncidentKey();
  try {
    const [result] = await db.query(
      `INSERT INTO incidents 
        (title, description, website_id, status, incident_key, created_by, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, website_id, statusCode, incidentKey, user_id]
    );

    res.status(201).json({
      message: "Incident created successfully.",
      incidentId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating incident:", error);
    return res.status(500).json({ message: "Error creating incident." });
  }
};

module.exports = {
  getIncidents,
  createIncident,
};
