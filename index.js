const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000
// middleware
app.use(cors())
app.use(express.json())
// mongodb
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zrua0aj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
// api
app.get('/', (req, res) => {
    res.send('Gadget Shop Server')
})
// jwt
app.post('/auth', async (req, res) => {
    const userEmail = req.body;
    const token = jwt.sign(userEmail, process.env.JWT_ACCESS_TOKEN, { expiresIn: process.env.TOKEN_EXPIRATION });
    res.send({ token });
})
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})