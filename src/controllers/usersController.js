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

// Fetch all users
const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, email, first_name, last_name, date_created, is_verified, password FROM users"
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    const formattedUsers = users.map(user => ({
      ...user,
      verified: !!user.password,
    }));

    return res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Error fetching users" });
  }
};

/*
// Fetch a single user by ID
const getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const [user] = await db.query("SELECT id, email, name, role FROM users WHERE id = ?", [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: `User with ID ${userId} not found` });
    }

    return res.json({ user: user[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Error fetching user" });
  }
};
*/

// Create a new user
const createUser = async (req, res) => {
  const { first_name, last_name, email } = req.body;
  const krikemDefaultMail = process.env.KRIKWATCH_DEFAULT_MAIL;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res
        .status(200)
        .json({ message: "User with this email already exists" });
    }

    const passwordRequestToken = generateRandomToken(24);
    const userToken = generateRandomToken(24);

    const [result] = await db.query(
      `INSERT INTO users 
      (first_name, last_name, email, password, password_request_token, date_created, is_verified, user_token) 
      VALUES (?, ?, ?, '', ?, NOW(), 0, ?)`,
      [first_name, last_name, email, passwordRequestToken, userToken]
    );

    const emailTemplatePath = path.join(
      __dirname,
      "../templates/confirmAccount.html"
    );
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

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

    const environment = process.env.ENVIRONMENT || "development";
    let appUrl = process.env.TEST_FRONTEND_URL;
    if (environment === "production") {
      appUrl = process.env.FRONTEND_URL;
    }

    const setupLink = `${appUrl}/password-create?t=${passwordRequestToken}`;

    const populatedTemplate = emailTemplate.replace(
      /{{setupLink}}/g,
      setupLink
    );

    const mailOptions = {
      from: `"KrikWatch" <${krikemDefaultMail}>`,
      to: email,
      subject: "Confirm your account",
      html: populatedTemplate,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

      console.log("Email sent: " + info.response);
      res.status(201).json({
        message: "User created successfully.",
        userId: result.insertId,
      });
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Error creating user" });
  }
};

const setPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  try {
    const [user] = await db.query(
      "SELECT * FROM users WHERE password_request_token = ?",
      [token]
    );

    if (user.length === 0) {
      return res.status(200).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ?, password_request_token = NULL, is_verified = 1 WHERE id = ?",
      [hashedPassword, user[0].id]
    );

    return res.status(200).json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Error setting password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Update user's information
const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { first_name, last_name, email } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ message: "First name, last name, and email are required" });
  }

  try {
    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: `User not found` });
    }

    await db.query(
      "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, userId]
    );

    return res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Error updating user" });
  }
};

// Delete a user
/*
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // Check if user exists
    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: `User with ID ${userId} not found` });
    }

    // Delete the user from the database
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Error deleting user" });
  }
};
*/

module.exports = {
  getUsers,
  //getUserById,
  createUser,
  setPassword,
  updateUser,
  //deleteUser,
};
