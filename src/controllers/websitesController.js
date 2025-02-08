const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

const takeScreenshot = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ message: "URL is required." });

  const fileName = `screenshot-${Date.now()}.png`;
  const filePath = path.join(__dirname, "../../uploads/screenshots", fileName);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.setViewport({ width: 1920, height: 1080 });
    await page.screenshot({ path: filePath, fullPage: true });
    await browser.close();

    res.json({ imageUrl: `/screenshots/${fileName}` });
  } catch (error) {
    console.error("Screenshot error:", error);
    res.status(500).json({ message: "Error capturing screenshot." });
  }
};

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

    const [incidents] = await db.query(
      `SELECT 
        i.incident_key, 
        i.title, 
        i.description, 
        i.status, 
        i.created_at, 
        i.updated_at,
        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name
      FROM incidents i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.website_id = ?`,
      [websiteId]
    );

    const formattedIncidents = incidents.map((incident) => ({
      ...incident,
      created_by: `${incident.created_by_first_name} ${incident.created_by_last_name}`,
    }));

    return res.json({ website: website[0], incidents: formattedIncidents });
  } catch (error) {
    console.error("Error fetching website and incidents:", error);
    return res
      .status(500)
      .json({ message: "Error fetching website and incidents" });
  }
};

// Create new website
const createWebsite = async (req, res) => {
  const { name, url, client_id, uptime_id, hosting_url, hosting_info } =
    req.body;

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
      (name, status, client_id, created_at, website_url, uptime_id, hosting_url, hosting_info) 
      VALUES (?, 1, ?, NOW(), ?, ?, ?, ?)`,
      [name, client_id, url, uptime_id, hosting_url, hosting_info]
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
  const { name, website_url, client_id, uptime_id, hosting_url, hosting_info } =
    req.body;

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
      "UPDATE websites SET name = ?, client_id = ?, website_url = ?, uptime_id = ?, hosting_url = ?, hosting_info = ? WHERE id = ?",
      [
        name,
        client_id,
        website_url,
        uptime_id,
        hosting_url,
        hosting_info,
        websiteId,
      ]
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
  takeScreenshot,
  getWebsites,
  getWebsiteById,
  createWebsite,
  updateWebsite,
  deleteWebsite,
};
