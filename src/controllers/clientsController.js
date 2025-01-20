const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

// Fetch all clients
const getClients = async (req, res) => {
  try {
    const [clients] = await db.query(
      `
      SELECT 
        clients.*, 
        COUNT(websites.id) AS website_count
      FROM clients
      LEFT JOIN websites ON clients.id = websites.client_id
      GROUP BY clients.id
      `
    );

    if (clients.length === 0) {
      return res.status(404).json({ message: "No clients found" });
    }

    return res.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(500).json({ message: "Error fetching clients" });
  }
};

// Create new client
const createClient = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name field is required." });
  }

  try {
    const [existingClient] = await db.query(
      "SELECT * FROM clients WHERE name = ?",
      [name]
    );

    if (existingClient.length > 0) {
      return res
        .status(200)
        .json({ message: "Client with this name already exists" });
    }

    const [result] = await db.query(
      `INSERT INTO clients 
      (name, status, created_at) 
      VALUES (?, 1, NOW())`,
      [name]
    );

    res.status(201).json({
      message: "Client created successfully.",
      clientId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return res.status(500).json({ message: "Error creating client." });
  }
};

// Update client's information
const updateClient = async (req, res) => {
  const clientId = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const [client] = await db.query("SELECT * FROM clients WHERE id = ?", [clientId]);

    if (client.length === 0) {
      return res.status(404).json({ message: `Client not found` });
    }

    await db.query(
      "UPDATE clients SET name = ? WHERE id = ?",
      [name, clientId]
    );

    return res.json({ message: "Client updated successfully" });
  } catch (error) {
    console.error("Error updating client:", error);
    return res.status(500).json({ message: "Error updating client" });
  }
};

module.exports = {
    getClients,
    createClient,
    updateClient,
};