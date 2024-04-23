require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const compression = require("compression");
const winston = require("winston");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const http = require("http");

//Glabal variables
const app = express();
const server = http.createServer(app);

let TOKEN, ID;

const pool = mysql.createPool({
  host: "noteai.c1k2keugaxsb.af-south-1.rds.amazonaws.com",
  user: process.env.MYSQL_USERNAME,
  port: 3306,
  database: "noteai",
  password: process.env.MYSQL_PASSWORD + "#",
  connectionLimit: 10, // Adjust according to your needs
  handshakeTimeout: 30000, // 30 seconds, adjust as needed
});

const ALLOWED_ORIGIN = process.env.LOCAL_API;
const PORT = process.env.PORT || 8080;
const SOCKET_PORT = process.env.SOCKET_PORT || 3004;

const LOG_PATH = "/var/log/email-tester/connection.log";

const LOGGER = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: LOG_PATH }),
  ],
});

//express
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    // origin: ALLOWED_ORIGIN,
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// secure server
// const ssl = {
//   key: fs.readFileSync(
//     "/etc/letsencrypt/live/christianmacarthur.com/privkey.pem"
//   ),
//   cert: fs.readFileSync(
//     "/etc/letsencrypt/live/christianmacarthur.com/cert.pem"
//   ),
//   ca: fs.readFileSync("/etc/letsencrypt/live/christianmacarthur.com/chain.pem"),
// };

// https.createServer(ssl, app).listen(PORT, () => {
//   LOGGER.info(`Secure server running on port ${PORT}...`);
// });

//unsecure server
try {
  app.listen(PORT, () => LOGGER.info(`Backend on port ${PORT}...`));
} catch (e) {
  LOGGER.error(
    "An error ocurred with the server. Read the error log for more details.",
    e.message
  );
}

//Functions

//websockets operations
io.on("connection", (socket) => {
  //Fetch notes
  socket.on("clientData", (data) => {
    const query = "SELECT content, isCompleted  FROM notes WHERE user_id = ?";
    pool.query(query, [ID], (err, results) => {
      if (err) {
        console.error("Error fetching notes:", err);
        socket.emit("serverData", {
          error: "Internal Server Error",
        });
      }

      socket.emit("serverData", results);
    });
  });

  //new task
  socket.on("newTask", (data) => {
    const { newTask, userId } = data;
    const query =
      "INSERT INTO notes (content, isCompleted, user_id) VALUES (?, ?, ?)";
    pool.query(query, [newTask, 0, userId], (err, results) => {
      if (err) {
        console.error("Error adding a new note:", err);
        socket.emit("serverData", {
          error: "Internal Server Error",
        });
      }
      // Return the ID of the newly created note
      socket.emit("serverData", {
        id: results.insertId,
        message: "Note added successfully",
      });
    });
  });

  //update task
  socket.on("updateTask", (data) => {
    const { id, userId } = data;
    const query =
      "UPDATE notes SET isCompleted = 1 WHERE id = ? AND user_id = ?";
    pool.query(query, [id, userId], (err, results) => {
      if (err) {
        console.error("Error updating note:", err);
        socket.emit("serverData", {
          error: "Internal Server Error",
        });
      }
      // Return the ID of the newly created note
      socket.emit("serverData", {
        id: results.insertId,
        message: "Note updated successfully",
      });
    });
  });
});

function timeoutMiddleware(req, res, next) {
  const timer = 3600;

  let responseSent = false;
  const timeoutTimer = setTimeout(() => {
    if (!responseSent) {
      responseSent = true;
      return res.json("Timeout");
    }
  }, timer);

  const originalJson = res.json;
  res.json = function (data) {
    if (!responseSent) {
      responseSent = true;
      clearTimeout(timeoutTimer);
      originalJson.call(res, data);
    }
  };

  next();
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (TOKEN === null) return res.json("Access denied, Log in first");

  jwt.verify(
    TOKEN || authHeader,
    process.env.ACCESS_TOKEN_SECRET,
    (err, user) => {
      if (err)
        return res.json({
          id: 0,
          token: "Token is invalid, Please Log in.",
        });
      req.user = user;
      next();
    }
  );
};

const testToken = (res) => {
  axios
    .get("http://localhost:3003/api/testtoken", {
      headers: {
        authorization: TOKEN,
      },
    })
    .then((response) => {
      LOGGER.info("Token is valid");
      return res.status(200).json(response.data);
    })
    .catch((error) => {
      LOGGER.error(error);
      return res.status(403).json("Token is invalid");
    });
};

//endpoints
app.use(timeoutMiddleware);

app.post("/api/llama", authenticateToken, (req, res) => {
  const model = "llama2";
  const { prompt } = req.body;
  console.log(prompt);
});

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API is working!" });
});

app.get("/api/testToken", authenticateToken, (req, res) => {
  res.status(200).json({ token: TOKEN, id: ID });
});

app.get("/api/testdb", (req, res) => {
  // Try to connect to the database and execute a simple query
  pool.getConnection((error, connection) => {
    if (error) {
      console.error("Error connecting to database:", error);
      res.status(500).send("Error connecting to database");
    } else {
      connection.query("SELECT 1 + 1 AS result", (queryError, results) => {
        // Release the connection back to the pool
        connection.release();

        if (queryError) {
          console.error("Error executing query:", queryError);
          res.status(500).send("Error executing query");
        } else {
          console.log("Database connection test successful");
          res.status(200).json({ result: results[0].result });
        }
      });
    }
  });
});

//new note
app.post("/api/newNote", authenticateToken, (req, res) => {
  const { content, isCompleted, userId } = req.body;

  // Insert the new note into the database
  const query =
    "INSERT INTO notes (content, isCompleted, user_id) VALUES (?, ?, ?)";
  pool.query(query, [content, isCompleted, userId], (err, results) => {
    if (err) {
      console.error("Error adding a new note:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    // Return the ID of the newly created note
    res
      .status(201)
      .json({ id: results.insertId, message: "Note added successfully" });
  });
});

//update note
app.post("/api/updateNote", authenticateToken, (req, res) => {
  const { content, noteId } = req.body;

  // Insert the new note into the database
  const query = "UPDATE notes SET content = ? WHERE id = ?";
  pool.query(query, [content, noteId], (err, results) => {
    if (err) {
      console.error("Error updating note:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    // Return the ID of the newly created note
    res.status(201).json({ message: "Note updated successfully" });
  });
});

app.post("/api/completeNote", authenticateToken, (req, res) => {
  const noteId = req.body.noteId;

  // Toggle the state of the note in the database
  const updateQuery =
    "UPDATE notes SET isCompleted = NOT isCompleted WHERE id = ?";
  pool.query(updateQuery, [noteId], (err, results) => {
    if (err) {
      console.error("Error updating note state:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Check if the note was found and updated
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Note state updated successfully" });
  });
});

//delete note
app.post("/api/deleteNote", authenticateToken, (req, res) => {
  const noteId = req.body.noteId;

  // Delete the note from the database
  const deleteQuery = "DELETE FROM notes WHERE id = ?";
  pool.query(deleteQuery, [noteId], (err, results) => {
    if (err) {
      console.error("Error deleting note:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Check if the note was found and deleted
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted successfully" });
  });
});

//get notes
app.get("/api/notes/:userId", authenticateToken, (req, res) => {
  const userId = req.params.userId;

  // Retrieve notes for the specified user from the database
  const query = "SELECT content, isCompleted, id  FROM notes WHERE user_id = ?";
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching notes:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Return the fetched notes
    res.status(200).json(results);
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the user is already logged in by testing the token
  if (testToken === "token is valid") {
    return res.status(200).json({ token: TOKEN, id: "" });
  }

  // Retrieve user information based on the provided email
  const query = "SELECT id, email, password FROM users WHERE email = ?";
  pool.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Check if the user exists
    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password from the database
    let user = results[0];
    bcrypt.compare(password, user.password, (bcryptErr, passwordMatch) => {
      if (bcryptErr) {
        console.error("Error comparing passwords:", bcryptErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Successful login
      try {
        const options = {
          expiresIn: "10m",
        };

        const accessToken = jwt.sign(
          { email, password },
          process.env.ACCESS_TOKEN_SECRET,
          options
        );
        TOKEN = accessToken;
        ID = user.id;
        return res.status(200).json({
          id: user.id,
          token: accessToken,
          message: "Loggin successfully",
        });
      } catch (error) {
        console.log(error);
        return res
          .status(401)
          .json({ error: "Problem while creating the token" });
      }
    });
  });
});

app.post("/api/signin", (req, res) => {
  const { email, password } = req.body;

  // Hash the password before storing it in the database
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Insert the new user into the database
    const insertQuery = "INSERT INTO users (email, password) VALUES (?, ?)";
    pool.query(insertQuery, [email, hashedPassword], (insertErr, results) => {
      if (insertErr) {
        console.error("Error creating a new user:", insertErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      // Successful sign-in
      axios
        .post("http://localhost:3003/api/login", {
          email: email,
          password: password,
        })
        .then((response) => {
          LOGGER.info(response.data);
          return res.status(200).json(response.data);
        })
        .catch((error) => {
          LOGGER.error(error);
          return res.status(403).json("Token is invalid");
        });
    });
  });
});

app.get("/api/signout", (req, res) => {
  TOKEN = null;
  ID = null;
  return res
    .status(200)
    .json({ token: TOKEN, message: "User logged out successfully" });
});

// API Endpoint to Fetch Data
app.get("/api/setup", (req, res) => {
  // Create Table
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL
        )
      `;

  // Insert Sample Data
  const insertDataQuery = `
        INSERT INTO users (name, email) VALUES
        ('John Doe', 'john@example.com'),
        ('Jane Smith', 'jane@example.com')
      `;

  // Execute queries
  pool.query(createTableQuery, (error) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error creating table");
    } else {
      pool.query(insertDataQuery, (error) => {
        if (error) {
          res.status(500).send("Error inserting data");
        } else {
          res.status(200).send("Table created and data inserted successfully");
        }
      });
    }
  });
});

// API Endpoint to Fetch Data
app.get("/api/data", (req, res) => {
  // Fetch Data
  pool.query("SELECT * FROM test", (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error fetching data");
    } else {
      res.status(200).json(results);
    }
  });
});
