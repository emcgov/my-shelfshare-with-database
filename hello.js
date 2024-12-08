const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
const uri = "mongodb+srv://shelfuser:Soccer123@cluster0.smdvj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let usersCollection;

(async function connectToDatabase() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('final'); // Database name
        usersCollection = db.collection('users'); // Collection name
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
})();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required.');

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) return res.status(400).send('User already exists.');

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({
        username,
        password: hashedPassword,
        name: '',
        bio: '',
        address: '',
        books: [],
    });
    res.status(201).send('User registered successfully.');
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await usersCollection.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).send('Invalid username or password.');
    }

    res.status(200).json({
        username: user.username,
        name: user.name,
        bio: user.bio,
        address: user.address,
        books: user.books,
    });
});

// Get profile endpoint
app.get('/profile', async (req, res) => {
    const { username } = req.query;
    const user = await usersCollection.findOne({ username }, { projection: { password: 0 } });

    if (!user) {
        return res.status(404).send('User not found.');
    }
    res.status(200).json(user);
});

// Update profile endpoint
app.post('/update-profile', async (req, res) => {
    const { username, name, bio, address, books } = req.body;

    try {
        const result = await usersCollection.updateOne(
            { username },
            { $set: { name, bio, address, books } }
        );

        if (result.modifiedCount > 0) {
            res.status(200).send('Profile updated successfully.');
        } else {
            res.status(400).send('Failed to update profile.');
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('An error occurred while updating the profile.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
