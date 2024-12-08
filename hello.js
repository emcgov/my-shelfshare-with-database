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

app.get('/profile', async (req, res) => {
    const { username } = req.query;

    try {
        const user = await usersCollection.findOne({ username }, { projection: { password: 0 } });

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).send('User not found.');
        }
    } catch (err) {
        console.error('Error retrieving profile:', err);
        res.status(500).send('An error occurred while retrieving the profile.');
    }
});
