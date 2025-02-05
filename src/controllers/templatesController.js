const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

// Fetch all templates
const getTemplates = async (req, res) => {
  try {
    const [templates] = await db.query(`
      SELECT * FROM message_templates`);

    if (templates.length === 0) {
      return res.status(200).json({ templates: [] });
    }

    return res.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return res.status(500).json({ message: "Error fetching templates" });
  }
};

// Create new template
const createTemplate = async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO message_templates 
          (title, content) 
          VALUES (?, ?)`,
      [title, content]
    );

    res.status(201).json({
      message: "Template created successfully.",
      templateId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    return res.status(500).json({ message: "Error creating template." });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
};
