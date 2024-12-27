const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

// Fetch all websites
const getWebsites = async (req, res) => {
  try {
    const [websites] = await db.query(
      `
        SELECT 
          websites.*, 
          clients.name AS client_name
        FROM websites
        LEFT JOIN clients ON websites.client_id = clients.id
        `
    );

    if (websites.length === 0) {
      return res.status(404).json({ message: "No websites found" });
    }

    return res.json({ websites });
  } catch (error) {
    console.error("Error fetching websites:", error);
    return res.status(500).json({ message: "Error fetching websites" });
  }
};

// Fetch a single website by ID
const getWebsiteById = async (req, res) => {
  const websiteId = req.params.id;

  try {
    const [website] = await db.query("SELECT * FROM websites WHERE id = ?", [
      websiteId,
    ]);

    if (website.length === 0) {
      return res.status(404).json({ message: `Website not found` });
    }

    return res.json({ website: website[0] });
  } catch (error) {
    // Handle errors
    console.error("Error fetching website:", error);
    return res.status(500).json({ message: "Error fetching website" });
  }
};

// Create new website
const createWebsite = async (req, res) => {
  const { name, url, client_id, uptime_id } = req.body;

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
      (name, status, client_id, created_at, website_url, uptime_id) 
      VALUES (?, 1, ?, NOW(), ?, ?)`,
      [name, client_id, url, uptime_id]
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

const updateWebsite = async (req, res) => {
  const websiteId = req.params.id;
  const { name, website_url, client_id, uptime_id } = req.body;

  if (!name || !client_id) {
    return res
      .status(400)
      .json({ message: "Website name and client ID are required" });
  }

  try {
    const [website] = await db.query("SELECT * FROM websites WHERE id = ?", [
      websiteId,
    ]);

    if (website.length === 0) {
      return res.status(404).json({ message: `Website not found` });
    }

    await db.query(
      "UPDATE websites SET name = ?, client_id = ?, website_url = ?, uptime_id = ? WHERE id = ?",
      [name, client_id, website_url, uptime_id, websiteId]
    );

    return res.json({ message: "Website updated successfully" });
  } catch (error) {
    console.error("Error updating website:", error);
    return res.status(500).json({ message: "Error updating website" });
  }
};

// Delete website
const deleteWebsite = async (req, res) => {
  const websiteId = req.params.id;

  try {
    const [website] = await db.query("SELECT * FROM websites WHERE id = ?", [
      websiteId,
    ]);

    if (website.length === 0) {
      return res.status(404).json({ message: `Website not found` });
    }

    await db.query("DELETE FROM websites WHERE id = ?", [websiteId]);

    return res.status(200).json({ message: "Website deleted successfully" });
  } catch (error) {
    console.error("Error deleting website:", error);
    return res.status(500).json({ message: "Error deleting website" });
  }
};

module.exports = {
  getWebsites,
  getWebsiteById,
  createWebsite,
  updateWebsite,
  deleteWebsite,
};
