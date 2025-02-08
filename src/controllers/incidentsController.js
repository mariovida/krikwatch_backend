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
      return res.status(200).json({ incidents: [] });
    }

    return res.json({ incidents });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return res.status(500).json({ message: "Error fetching incidents" });
  }
};

// Fetch a single incident by ID
const getIncidentById = async (req, res) => {
  const incidentId = req.params.id;

  try {
    const [incident] = await db.query(
      `SELECT
        i.id,
        i.incident_key, 
        i.title, 
        i.description,
        i.note,
        i.status, 
        i.created_at, 
        i.updated_at,
        i.created_by,
        i.website_id,
        i.incident_start,
        i.incident_end,
        u.first_name, 
        u.last_name,
        w.name AS websiteName
      FROM incidents i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN websites w ON i.website_id = w.id
      WHERE i.incident_key = ?`,
      [incidentId]
    );

    if (incident.length === 0) {
      return res.status(404).json({ message: `Incident not found` });
    }

    const incidentData = {
      ...incident[0],
      created_by:
        incident[0].first_name && incident[0].last_name
          ? `${incident[0].first_name} ${incident[0].last_name}`
          : "Unknown",
      website_name: incident[0].websiteName || "Unknown",
    };

    delete incidentData.first_name;
    delete incidentData.last_name;
    delete incidentData.websiteName;

    const [contacts] = await db.query(
      `SELECT id, first_name, last_name, email FROM website_contacts WHERE website_id = ?`,
      [incidentData.website_id]
    );

    const [messages] = await db.query(
      `SELECT
        m.id,
        m.sent_at, 
        m.sent_to,
        wc.first_name,
        wc.last_name
      FROM messages m
      LEFT JOIN incidents i ON m.incident_id = i.id
      LEFT JOIN website_contacts wc ON m.contact_id = wc.id
      WHERE i.incident_key = ?
      ORDER BY m.sent_at DESC;`,
      [incidentId]
    );

    return res.json({ incident: incidentData, contacts, messages });
  } catch (error) {
    console.error("Error fetching incident:", error);
    return res.status(500).json({ message: "Error fetching incident" });
  }
};

const formatDate = (date) => {
  if (date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d
      .getHours()
      .toString()
      .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }
  return null;
};

// Get messages
const getMessages = async (req, res) => {
  const { id } = req.params;

  try {
    const [message] = await db.query(`SELECT * FROM messages WHERE id = ?`, [
      id,
    ]);

    if (message.length === 0) {
      return res.status(404).json({ message: `Message not found` });
    }

    return res.json({ message: message[0] });
  } catch (error) {
    console.error("Error fetching message:", error);
    return res.status(500).json({ message: "Error fetching message" });
  }
};

// Create new incident
const createIncident = async (req, res) => {
  const {
    title,
    description,
    note,
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
  const formattedStartTime = formatDate(start_time);
  const formattedEndTime = formatDate(end_time);
  try {
    const [result] = await db.query(
      `INSERT INTO incidents 
        (title, description, note, website_id, status, incident_key, incident_start, incident_end, created_by, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title,
        description,
        note,
        website_id,
        statusCode,
        incidentKey,
        formattedStartTime,
        formattedEndTime,
        user_id,
      ]
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

// Update incident
const updateIncident = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    note,
    website_id,
    status,
    incident_start,
    incident_end,
  } = req.body;

  let statusCode;
  if (status === "OPEN" || status === 1) {
    statusCode = 1;
  } else if (status === "IN PROGRESS" || status === 2) {
    statusCode = 2;
  } else if (status === "RESOLVED" || status === 3) {
    statusCode = 3;
  } else {
    statusCode = 4;
  }

  if (!id) {
    return res.status(400).json({ message: "Incident ID is required." });
  }

  if (!website_id || !title) {
    return res
      .status(400)
      .json({ message: "Title and website ID are required." });
  }

  const formattedStartTime = formatDate(incident_start);
  const formattedEndTime = formatDate(incident_end);

  try {
    const [result] = await db.query(
      `UPDATE incidents 
        SET title = ?, 
            description = ?, 
            note = ?, 
            website_id = ?, 
            status = ?, 
            incident_start = ?, 
            incident_end = ?,
            updated_at = NOW() 
        WHERE incident_key = ?`,
      [
        title,
        description,
        note,
        website_id,
        statusCode,
        formattedStartTime,
        formattedEndTime,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Incident not found." });
    }

    res.status(200).json({ message: "Incident updated successfully." });
  } catch (error) {
    console.error("Error updating incident:", error);
    return res.status(500).json({ message: "Error updating incident." });
  }
};

// Update incident status
const updateIncidentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const query =
      status === 3
        ? "UPDATE incidents SET status = ?, resolved_at = NOW() WHERE id = ?"
        : "UPDATE incidents SET status = ? WHERE id = ?";

    const params = status === 3 ? [status, id] : [status, id];
    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Incident not found" });
    }

    return res.json({ message: "Incident status updated successfully" });
  } catch (error) {
    console.error("Error updating incident status:", error);
    return res.status(500).json({ message: "Error updating incident status" });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  getMessages,
  createIncident,
  updateIncident,
  updateIncidentStatus,
};
