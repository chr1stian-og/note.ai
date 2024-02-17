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

//Glabal variables
const app = express();

let TOKEN;

const pool = mysql.createPool({
  host: "noteai.c1k2keugaxsb.af-south-1.rds.amazonaws.com",
  user: process.env.MYSQL_USERNAME,
  port: 3306,
  database: "noteai",
  password: process.env.MYSQL_PASSWORD + "#",
  connectionLimit: 10, // Adjust according to your needs
  handshakeTimeout: 30000, // 30 seconds, adjust as needed
});

// firebaseAuth.initializeApp({
//   credential: firebaseAuth.credential.cert(credentials),
// });

const ALLOWED_ORIGIN = process.env.REACT_APP_LOCAL_API;
const PORT = process.env.PORT || 3001;

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
function sendResponse(res, status, text, err) {
  !res.headersSent &&
    (console.log("Sending response:", text + (err ? " " + err : "")),
    res.status(status).json(text + (err ? " " + err : "")));
}

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
      if (err) return res.json("Token is invalid, Log in.");
      req.user = user;
      next();
    }
  );
};

const testToken = (res) => {
  axios
    .get("http://noteai.christianmacarthur/api/testtoken", {
      headers: {
        authorization: TOKEN,
      },
    })
    .then((response) => {
      return res.status(200).json(response.data);
    })
    .catch((error) => {
      LOGGER.error(error);
      return res.status(403).json("Token is invalid");
    });
};

//endpoints
app.use(timeoutMiddleware);

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
app.post("/api/newNote", (req, res) => {
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

//get notes
app.get("/api/notes/:userId", (req, res) => {
  const userId = req.params.userId;

  // Retrieve notes for the specified user from the database
  const query = "SELECT content, isCompleted  FROM notes WHERE user_id = ?";
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching notes:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Return the fetched notes
    res.status(200).json(results);
  });
});

app.get("/api/newUser", (req, res) => {
  const username = "daniel";
  const password = "df59c2577";

  const query = " insert into users (username, password) values (?, ?)";
  pool.query(query, [username, password], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "internal server error" });
    }
    res
      .status(201)
      .json({ id: results.insertId, message: "User created successfully" });
  });
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

app.get("/api/test", (req, res) => {
  res.json("Hello World");
});

// app.get("/api/testFirebase", (req, res) => {
//   res.json(auth.currentUser);
// });

app.get("/api/token", (req, res) => {
  testToken(res);
});

app.get("/api/getCounters", (req, res) => {
  const db2 = firebaseAuth.firestore();

  db2
    .collection("countTests")
    .get()
    .then((querySnapshot) => {
      const counters = [];
      querySnapshot.forEach((doc) => {
        res.json(doc.data().email);
      });
    })
    .catch((error) => {
      res.json("Error getting documents: " + error);
    });
});

app.get("/api/testToken", authenticateToken, (req, res) => {
  res.json("Token is valid");
});

// app.post("/api/signup", async (req, res) => {
//   const { email, password } = req.body || {
//     email: "christian@gmail.com",
//     password: "christian",
//   };

//   try {
//     const userResponse = await firebaseAuth.auth().createUser({
//       email: email,
//       password: password,
//       emailVerified: true,
//       disabled: false,
//     });
//     return res.status(200).json(userResponse);
//   } catch (e) {
//     LOGGER.error(e);
//     return res.status(500).json(e.message);
//   }
// });

app.get("/api/login", async (req, res) => {
  const { email, password } = req.body || {
    email: "informapa@clubnet.mz",
    password: "Informapa2023#",
  };

  const isLoggedIn = auth.currentUser;
  if (isLoggedIn) {
    return res.json({ accessToken: TOKEN });
  }

  try {
    const login = await signInWithEmailAndPassword(auth, email, password);

    if (login) {
      const options = {
        expiresIn: "10m",
      };

      const accessToken = jwt.sign(
        { email, password },
        process.env.ACCESS_TOKEN_SECRET,
        options
      );
      TOKEN = accessToken;
      return res.status(200).json({ accessToken: accessToken });
    }
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
});
