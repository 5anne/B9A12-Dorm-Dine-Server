const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRPE_SECRET_KEY)
const app = express();
const port = process.env.PORT || 5000;

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://dorm-dine-6deee.web.app",
            "https://dorm-dine-6deee.firebaseapp.com",
        ]
    })
);
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zwtdtr7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const allMealsCollection = client.db('dineDB').collection('allMeals');
        const userInfoDB = client.db('dineDB').collection('userInfo');
        const mealJsonDB = client.db('dineDB').collection('mealJson');
        const premiumJsonDB = client.db('dineDB').collection('premiumJson');
        const paymentJsonDB = client.db('dineDB').collection('payments');

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ token });
        })

        const verifyToken = (req, res, next) => {
            console.log('Inside Verify Token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }
                req.decoded = decoded;
                next();
            })
        }

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userInfoDB.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        app.get("/allMeals", async (req, res) => {
            const cursor = allMealsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/allMeals/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allMealsCollection.findOne(query);
            res.send(result);
        })

        app.get("/mealJson", async (req, res) => {
            const result = await mealJsonDB.find().toArray();
            res.send(result);
        })

        app.get('/mealJson/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await mealJsonDB.findOne(query);
            res.send(result);
        })

        app.get("/premiumJson", async (req, res) => {
            const result = await premiumJsonDB.find().toArray();
            res.send(result);
        })

        app.get('/premiumJson/:badge', async (req, res) => {
            const badge = req.params.badge;
            const query = { badge: badge };
            const result = await premiumJsonDB.findOne(query);
            res.send(result);
        })

        app.get("/userInfo", verifyToken, verifyAdmin, async (req, res) => {
            const result = await userInfoDB.find().toArray();
            res.send(result);
        })

        app.get('/userInfo/:name', verifyToken, verifyAdmin, async (req, res) => {
            const query = { name: req.params.name }
            const result = await userInfoDB.find(query).toArray();
            res.send(result);
        })

        app.get('/userInfo/:email', verifyToken, verifyAdmin, async (req, res) => {
            const query = { email: req.params.email }
            const result = await userInfoDB.find(query).toArray();
            res.send(result);
        })

        app.get('/userInfo/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userInfoDB.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

        app.get('/payments/:email', verifyToken, async (req, res) => {
            const query = { email: req.params.email }
            if (req.params.email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const result = await paymentJsonDB.find(query).toArray();
            res.send(result);
        })

        app.post('/userInfo', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = { email: user.email }
            const existingUser = await userInfoDB.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User already exists!', insertedId: null })
            }
            const result = await userInfoDB.insertOne(user);
            res.send(result);
        })

        app.post('/allMeals', verifyToken, verifyAdmin, async (req, res) => {
            const meal = req.body;
            const result = await allMealsCollection.insertOne(meal);
            res.send(result);
        })

        app.patch('/mealJson/:id', async (req, res) => {
            const user = req.body;
            console.log(user);
            const id = user._id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    review: user.review,
                    reviewText: user.reviewText
                }
            }
            const result = await mealJsonDB.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/allMeals/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allMealsCollection.deleteOne(query);
            res.send(result);
        })

        // app.patch('/mealJson/:id', async (req, res) => {
        //     const id = req.params.id;
        //     console.log(id);
        //     const filter = { _id: new ObjectId(id) };
        //     console.log(filter);
        //     const updateDoc = {
        //         $set: {
        //             likeCount: user.likeCount
        //         }
        //     }
        //     console.log(updateDoc);
        //     const result = await mealJsonDB.updateOne(filter, updateDoc);
        //     console.log(result);
        //     res.send(result);
        // })

        app.patch('/userInfo/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userInfoDB.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.patch('/allMeals/:id', async (req, res) => {
            const meal = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    title: meal.title,
                    category: meal.category,
                    image: meal.image,
                    ingredients: meal.ingredients,
                    description: meal.description,
                    price: meal.price,
                    rating: meal.rating,
                    post_time: meal.post_time,
                    likes: meal.likes,
                    reviews: meal.reviews,
                    admin_name: meal.admin_name,
                    admin_email: meal.admin_email
                }
            }
            const result = await allMealsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            console.log(amount);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentJsonDB.insertOne(payment);

            console.log('payment info', payment);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Fooooooooooood Services!!!!');
})
app.listen(port, () => {
    console.log(`Cook Food on port ${port}`);
})