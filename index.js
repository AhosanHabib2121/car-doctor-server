const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x0j2vzp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middleware
const logger = async(req, res, next) => {
    console.log('called:', req.host, req.originalUrl);
    next();
}
const verifyToken = async(req, res, next) => {
    const token = req.cookies?.token;
    // console.log('value of token in middleware', token)
    if (!token) {
        return res.status(401).send({message:'Not authorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        // error
        if (err) {
            console.log(err)
            return res.status(401).send({message: 'Unauthorized'})
        }

        // if token is valid then it would be decode
        console.log('value in the token', decode)
        req.user = decode;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // database collection
        const serviceCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('booking');


        // -------------------Authentication related api------------
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.cookie('token', token , {
                httpOnly: true,
                secure: true,
                sameSite: false
                // secure: process.env.NODE_ENV === 'production',
                // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            })
            .send({success: true})
        }) 

        // logout and clear cookies data
        app.post('/logout', async(req, res) => {
            const user = req.body;
            console.log('logout user', user)
            res
                .clearCookie('token', { maxAge: 0 })
                .send({success: true})
        })

        // --------------------ServicesCollection here ----------------
        // get all data form servicesCollection
        app.get('/services', logger, async (req, res) => {
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
        app.get('/booking', logger, verifyToken, async (req, res) => {
            // console.log(req.query.email);
            // console.log('tttttt token', req.cookies?.token);
            // console.log('user in the valid token',req.user)
            console.log('cookies for booking', req.cookies)
            if (req.query?.email !== req.user?.email) {
                return res.status(403).send({ message: 'Forbidden'})
            }

            let query = {};
            if (req.query?.email) {
                query = {email: req.query.email}
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })
        // data post in bookingCollection
        app.post('/booking', logger, async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result)
        })

        // update data 
        app.patch('/booking/:id',async (req, res) => {
            const id = req.params.id;
            const Booking = req.body;
            const filter = {_id: new ObjectId(id)}
            const updateBooking = {
                $set: {
                    status: Booking.status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateBooking);
            res.send(result);
        })
        
        // bookingCollection data delete
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
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
    res.send('car doctor is running..');
})

app.listen(port, () => {
    console.log(`car doctor server on port: ${port}`)
})