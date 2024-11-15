const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
// verify token
const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = req.headers.authorization;
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}
// verify seller
const verifySeller = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await userCollection.findOne(query);
    const isSeller = user?.role === 'seller';
    if (!isSeller) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    next();
}

// mongodb
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zrua0aj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// databases collection
const userCollection = client.db('gadgetShopDb').collection('users');
const productCollection = client.db('gadgetShopDb').collection('products');

// async function to run the server
async function run() {
    try {
        // Ping MongoDB to check connection
        await client.db('admin').command({ ping: 1 });
        console.log('Pinged your deployment. You successfully connected to MongoDB!');

        // get a user
        app.get('/user', async (req, res) => {
            try {
                const { email } = req.query;
                if (!email) {
                    return res.status(400).json({ message: 'Email query parameter is required.' });
                }
                const user = await userCollection.findOne({ email });
                if (!user) {
                    return res.status(404).json({ message: 'User not found with the provided email.' });
                }
                res.status(200).json(user);
            } catch (error) {
                console.error('Error fetching user:', error.message);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });

        // create user
        app.post('/users', async (req, res) => {
            try {
                const user = req.body;
                const query = { email: user.email };
                const existingUser = await userCollection.findOne(query);
                if (existingUser) {
                    return res.send({ message: 'User already exists' });
                }
                const result = await userCollection.insertOne(user);
                res.send(result);
            } catch (error) {
                console.error('Error creating user:', error.message);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });
        app.get('/products', verifyToken, verifySeller, async (req, res) => {
            try {
                const email = req.query.email; // Get email from query params
                if (!email) {
                    return res.status(400).send({ message: "Email query parameter is required." });
                }

                // Query to find products associated with the email
                const query = { email };

                // Fetch products from the database
                const result = await productCollection.find(query).toArray();

                if (result.length === 0) {
                    return res.status(404).send({ message: "No products found for the specified email." });
                }

                // Return the products
                res.status(200).send(result);
            } catch (error) {
                console.error("Error fetching products by email:", error);
                res.status(500).send({ message: "An error occurred while fetching products." });
            }
        });
        // add a new product
        app.post('/add-products', verifyToken, verifySeller, async (req, res) => {
            try {
                const productData = req.body;
                const result = await productCollection.insertOne(productData);
                res.send(result);
            } catch (error) {
                console.error('Error adding product:', error.message);
                res.status(500).send({ message: 'An error occurred while adding the product' });
            }
        });

    } catch (error) {
        console.error('Error in database connection:', error.message);
    }
}

// Start the async function
run().catch((err) => console.error('Error running the application:', err));

// API endpoint for root
app.get('/', (req, res) => {
    res.send('Gadget Shop Server');
});

// JWT Authentication
app.post('/auth', async (req, res) => {
    const userEmail = req.body;
    const token = jwt.sign(userEmail, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: process.env.TOKEN_EXPIRATION,
    });
    res.send({ token });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
