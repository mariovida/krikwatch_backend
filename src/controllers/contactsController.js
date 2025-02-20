const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

const generateRandomToken = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

// Get contacts
const getContacts = async (req, res) => {
  const { websiteId } = req.params;

  try {
    const [contacts] = await db.query(
      "SELECT * FROM website_contacts WHERE website_id = ?",
      [websiteId]
    );

    if (contacts.length === 0) {
      return res.status(200).json({ contacts: [] });
    }

    return res.json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ message: "Error fetching contacts" });
  }
};

// Create new contact
const createContact = async (req, res) => {
  const { first_name, last_name, email, website_id } = req.body;

  if (!first_name || !last_name || !email || !website_id) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [existingContact] = await db.query(
      "SELECT * FROM website_contacts WHERE email = ?",
      [email]
    );

    if (existingContact.length > 0) {
      return res
        .status(200)
        .json({ message: "Contact with this email address already exists" });
    }

    const [result] = await db.query(
      `INSERT INTO website_contacts 
        (first_name, last_name, email, website_id, created_at) 
        VALUES (?, ?, ?, ?, NOW())`,
      [first_name, last_name, email, website_id]
    );

    res.status(201).json({
      message: "Contact created successfully.",
      clientId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    return res.status(500).json({ message: "Error creating contact." });
  }
};

// Update contact's information
const updateContact = async (req, res) => {
  const contactId = req.params.id;
  const { first_name, last_name, email } = req.body;

  if (!first_name || !last_name || !email) {
    return res
      .status(400)
      .json({ message: "First name, last name and email are required" });
  }

  try {
    const [contact] = await db.query(
      "SELECT * FROM website_contacts WHERE id = ?",
      [contactId]
    );

    if (contact.length === 0) {
      return res.status(404).json({ message: `Contact not found` });
    }

    await db.query(
      "UPDATE website_contacts SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, contactId]
    );

    return res.json({ message: "Contact updated successfully" });
  } catch (error) {
    console.error("Error updating contact:", error);
    return res.status(500).json({ message: "Error updating contact" });
  }
};

const sendEmail = async (req, res) => {
  const { contactId, title, email, message, incidentId } = req.body;
  const krikemDefaultMail = process.env.KRIKWATCH_DEFAULT_MAIL;
  const secretReceiverEmail = "mario@krikstudio.com"; 

  if (!email || !contactId || !message) {
    return res.status(400).json({ message: "Email and message are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const replyToEmails = process.env.EMAIL_REPLY_TO
      ? process.env.EMAIL_REPLY_TO.includes(",")
        ? process.env.EMAIL_REPLY_TO.split(",")
        : process.env.EMAIL_REPLY_TO
      : undefined;

    const emailSubject = title || "Obavijest o web usluzi";

    const mailOptions = {
      from: `"Krik studio" <${krikemDefaultMail}>`,
      to: email,
      //bcc: secretReceiverEmail,
      ...(replyToEmails && { replyTo: replyToEmails }),
      subject: emailSubject,
      text: message,
      html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
    };

    await transporter.sendMail(mailOptions);

    const [result] = await db.query(
      `INSERT INTO messages (message, sent_at, sent_to, contact_id, incident_id) VALUES (?, NOW(), ?, ?, ?)`,
      [message, email, contactId, incidentId]
    );

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "Email sent successfully!" });
    } else {
      return res.status(500).json({ message: "Email sent but failed to log." });
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ message: "Failed to send email." });
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  sendEmail,
};
