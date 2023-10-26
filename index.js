const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x0j2vzp.mongodb.net/?retryWrites=true&w=majority`;

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

        // database collection
        const serviceCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('booking');

        // --------------------ServicesCollection here ----------------
        // get all data form servicesCollection
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // get specific id base form servicesCollection
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
             const options = {
                 // Include only the specific fields in the returned document
                 projection: {
                    title: 1,
                    img: 1,
                    price: 1,
                    service_id:1
                 },
             };
            const result = await serviceCollection.findOne(query,options);
            res.send(result);
        })

        // ------------------bookingCollection here----------
        // get specific email base data
        app.get('/booking', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = {email: req.query.email}
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })
        // data post in bookingCollection
        app.post('/booking', async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result)
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
    res.send('car doctor is running..');
})

app.listen(port, () => {
    console.log(`car doctor server on port: ${port}`)
})