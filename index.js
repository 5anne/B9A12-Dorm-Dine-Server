const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
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
        await client.connect();

        const allMealsCollection = client.db('dineDB').collection('allMeals');
        const userInfoDB = client.db('dineDB').collection('userInfo');
        const mealJsonDB = client.db('dineDB').collection('mealJson');

        app.get("/allMeals", async (req, res) => {
            const cursor = allMealsCollection.find();
            const result = await cursor.toArray();
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

        app.get("/userInfo", async (req, res) => {
            const result = await userInfoDB.find().toArray();
            res.send(result);
        })

        app.post('/userInfo', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userInfoDB.insertOne(user);
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

        app.patch('/mealJson/:id', async (req, res) => {
            const user = req.body;
            console.log(user);
            const id = user._id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    likeCount: user.likeCount
                }
            }
            const result = await mealJsonDB.updateOne(filter, updateDoc);
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