const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

const getAvailability = async (req, res) => {
  const { userId } = req.query;

  try {
    const query = userId
      ? `SELECT * FROM available WHERE user_id = ?`
      : `SELECT * FROM available`;

    const result = await db.query(query, userId ? [userId] : []);

    res.status(200).json({ availability: result });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Error fetching availability" });
  }
};

const addAvailability = async (req, res) => {
  const { user_name, start_time, end_time } = req.body;

  try {
    const query = `
            INSERT INTO available (user_name, start_time, end_time, created_at) 
            VALUES (?, ?, ?, NOW())
        `;
    const result = await db.query(query, [user_name, start_time, end_time]);

    res.status(201).json({
      message: "Availability added successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding availability:", error);
    res.status(500).json({ message: "Error adding availability" });
  }
};

const updateAvailability = async (req, res) => {
  const { id } = req.params;
  const { user_name, start_time, end_time } = req.body;

  try {
    const query = `
        UPDATE available 
        SET user_name = ?, start_time = ?, end_time = ?
        WHERE id = ?
      `;

    const result = await db.query(query, [user_name, start_time, end_time, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Availability not found" });
    }

    res.status(200).json({
      message: "Availability updated successfully",
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: "Error updating availability" });
  }
};

const deleteAvailability = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
        DELETE FROM available 
        WHERE id = ?
      `;

    const result = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Availability not found" });
    }

    res.status(200).json({
      message: "Availability deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({ message: "Error deleting availability" });
  }
};

module.exports = {
  getAvailability,
  addAvailability,
  updateAvailability,
  deleteAvailability,
};
