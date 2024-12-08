const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
const uri = "mongodb+srv://shelfuser:Soccer123@cluster0.smdvj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(bodyParser.json()); // Parse JSON bodies

// Database connection
let usersCollection;
client.connect().then(() => {
  const db = client.db("final");
  usersCollection = db.collection("users");
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("Failed to connect to MongoDB:", err);
});

// Default route: Serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required.");
  }

  try {
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(400).send("User already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, password: hashedPassword });
    res.status(201).send("User registered successfully.");
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send("An error occurred during registration.");
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required.");
  }

  try {
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(400).send("Invalid username or password.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid username or password.");
    }

    res.status(200).send("Login successful.");
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("An error occurred during login.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
