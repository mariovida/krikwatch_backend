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
    const { userId, startTime, endTime } = req.body;

    try {
        const query = `
            INSERT INTO available (user_name, start_time, end_time, created_at) 
            VALUES (?, ?, ?, NOW())
        `;
        const result = await db.query(query, [userId, startTime, endTime]);

        res.status(201).json({ message: "Availability added successfully", id: result.insertId });
    } catch (error) {
        console.error("Error adding availability:", error);
        res.status(500).json({ message: "Error adding availability" });
    }
};

module.exports = { getAvailability, addAvailability };