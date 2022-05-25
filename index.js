const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

//middleware
app.use(cors());
app.use(express.json());

//tool_menufactures
//mxQHM42y60VJu2ke



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.guy8n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function verifyJWT(req, res, next) {
    const authheader = req.headers.authorization;
    if (!authheader) {
        return res.status(401).send({ message: 'unauthorize' })
    }
    const token = authheader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}
async function run() {
    try {
        await client.connect();
        const toolsMenufacture = client.db('tool_menufactures').collection('product_tools')
        const orderCollection = client.db('tool_menufactures').collection('orders')
        const userCollection = client.db('tool_menufactures').collection('users')
        const paymentCollection = client.db('tool_menufactures').collection('payments')

        app.get('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await toolsMenufacture.findOne(query)
            res.send(result)
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result);
        })

        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const orders = await orderCollection.find(query).toArray()
            res.send(orders)
        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1d' })
            res.send({ result, token });
        })

        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        //my profiles need unique user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const users = await userCollection.findOne(query)
            res.send(users);
        })

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAcc = await userCollection.findOne({ email: requester })
            if (requesterAcc.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden' })
            }
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            console.log(isAdmin)
            res.send({ admin: isAdmin })
        })


        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        })

        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({ clientSecret: paymentIntent.client_secret })
        });

        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const result = await paymentCollection.insertOne(payment);
            const updatedBooking = await orderCollection.updateOne(filter, updatedDoc);
            res.send(updatedBooking);
        })

        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await toolsMenufacture.insertOne(product);
            res.send(result);
        })


        app.get('/service', async (req, res) => {
            const product = {}
            const result = await toolsMenufacture.find(product).toArray();
            res.send(result);
        })
        app.get('/product', async (req, res) => {
            const product = {}
            const result = await toolsMenufacture.find(product).toArray();
            res.send(result);
        })

        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await toolsMenufacture.deleteOne(filter);
            res.send(result);
        })
        app.delete('/ordercancel/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/allorder', async (req, res) => {
            const product = {}
            const result = await orderCollection.find(product).toArray();
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Hello tools-manufacturs')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})