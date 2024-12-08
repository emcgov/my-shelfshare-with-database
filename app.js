const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require("mongodb");

const app = express();
const uri = "mongodb+srv://shelfuser:Soccer123@cluster0.smdvj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

app.use(bodyParser.json());

// Connect to the database
let usersCollection;
client.connect().then(() => {
  const db = client.db("final");
  usersCollection = db.collection("users");
  console.log("Connected to MongoDB");
});

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ username });
  if (existingUser) {
    return res.status(400).send("User already exists");
  }

  // Hash password and save to database
  const hashedPassword = await bcrypt.hash(password, 10);
  await usersCollection.insertOne({ username, password: hashedPassword });
  res.status(201).send("User registered successfully");
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  // Find user in database
  const user = await usersCollection.findOne({ username });
  if (!user) {
    return res.status(400).send("Invalid credentials");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).send("Invalid credentials");
  }

  res.status(200).send("Login successful");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
