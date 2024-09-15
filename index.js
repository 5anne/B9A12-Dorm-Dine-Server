const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRPE_SECRET_KEY)
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
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
        // await client.connect();

        const allMealsCollection = client.db('dineDB').collection('allMeals');
        const requestedMealsCollection = client.db('dineDB').collection('requestedMeals');
        const upcomingMealsCollection = client.db('dineDB').collection('upcomingMeals');
        const userInfoDB = client.db('dineDB').collection('userInfo');
        const premiumJsonDB = client.db('dineDB').collection('premiumJson');
        const paymentJsonDB = client.db('dineDB').collection('payments');
        const usersActivity = client.db('dineDB').collection('usersAct');

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
            console.log(req.decoded.email);
            const query = { email: email };
            const user = await userInfoDB.findOne(query);
            const isAdmin = user?.role === 'admin';
            console.log(isAdmin);
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

        app.get('/allMealsEmail/:email', async (req, res) => {
            const query = { admin_email: { $regex: new RegExp(req.params.email, '') } }
            const mealCount = await allMealsCollection.find(query).toArray();
            res.send(mealCount);
        })

        app.post('/allMeals', verifyToken, verifyAdmin, async (req, res) => {
            const meal = req.body;
            const result = await allMealsCollection.insertOne(meal);
            res.send(result);
        })

        app.patch('/allMeals/:id', verifyToken, async (req, res) => {
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
                    reviewText: meal.reviewText,
                    status: meal.status,
                    admin_name: meal.admin_name,
                    admin_email: meal.admin_email
                }
            }
            const result = await allMealsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/allMeals/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allMealsCollection.deleteOne(query);
            res.send(result);
        })

        app.get("/upcomingMeals", async (req, res) => {
            const result = await upcomingMealsCollection.find().toArray();
            res.send(result);
        })

        app.post('/upcomingMeals', verifyToken, verifyAdmin, async (req, res) => {
            const meal = req.body;
            const result = await upcomingMealsCollection.insertOne(meal);
            res.send(result);
        })

        app.patch('/upcomingMeals/:id', verifyToken, async (req, res) => {
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
                    reviewText: meal.reviewText,
                    status: meal.status,
                    admin_name: meal.admin_name,
                    admin_email: meal.admin_email
                }
            }
            const result = await upcomingMealsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/upcomingMeals/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await upcomingMealsCollection.deleteOne(query);
            res.send(result);
        })

        app.get("/usersAct", async (req, res) => {
            const result = await usersActivity.find().toArray();
            res.send(result);
        })

        app.get('/usersAct/:email', async (req, res) => {
            const query = { user_email: { $regex: new RegExp(req.params.email, 'i') } };
            const result = await usersActivity.find(query).toArray();
            res.send(result);
        })

        app.post('/usersAct', verifyToken, async (req, res) => {
            const meal = req.body;
            const result = await usersActivity.insertOne(meal);
            res.send(result);
        })

        app.patch('/usersAct/:id', verifyToken, async (req, res) => {
            const meal = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    reviewText: meal.reviewText
                }
            }
            const result = await usersActivity.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/usersAct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await usersActivity.deleteOne(query);
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

        app.get("/requestedMeals", verifyToken, async (req, res) => {
            const result = await requestedMealsCollection.find().toArray();
            res.send(result);
        })

        app.get('/requestedMeals/:name', verifyToken, verifyAdmin, async (req, res) => {
            const query = { user_name: { $regex: new RegExp(req.params.name, 'i') } }
            const result = await requestedMealsCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/requestedMealsEmail/:email', async (req, res) => {
            const query = { user_email: { $regex: new RegExp(req.params.email, 'i') } }
            const result = await requestedMealsCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/requestedMeals', verifyToken, async (req, res) => {
            const meal = req.body;
            const result = await requestedMealsCollection.insertOne(meal);
            res.send(result);
        })

        app.patch('/requestedMeals/:id', async (req, res) => {
            const meal = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    user_name: meal.user_name,
                    user_email: meal.user_email,
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
                    reviewText: meal.reviewText,
                    status: meal.status,
                    admin_name: meal.admin_name,
                    admin_email: meal.admin_email
                }
            }
            const result = await requestedMealsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/requestedMeals/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestedMealsCollection.deleteOne(query);
            res.send(result);
        })

        app.get("/userInfo", async (req, res) => {
            const result = await userInfoDB.find().toArray();
            res.send(result);
        })

        app.get('/userInfo/:name', async (req, res) => {
            const query = { name: { $regex: new RegExp(req.params.name, 'i') } }
            const result = await userInfoDB.find(query).toArray();
            res.send(result);
        })

        app.get('/userInfoEmail/:email', async (req, res) => {
            const query = { email: { $regex: new RegExp(req.params.email, 'i') } }
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

        app.patch('/userInfo/:email', async (req, res) => {
            const meal = req.body;
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: {
                    name: meal.name,
                    email: meal.email,
                    photo: meal.photo,
                    userBadge: meal.userBadge
                }
            }
            const result = await userInfoDB.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.get('/payments/:email', verifyToken, async (req, res) => {
            const query = { email: req.params.email }
            if (req.params.email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const result = await paymentJsonDB.find(query).toArray();
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
        // await client.db("admin").command({ ping: 1 });
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