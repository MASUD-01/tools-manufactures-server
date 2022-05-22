const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config();

//middleware
app.use(cors());
app.use(express.json());

//tool_menufactures
//mxQHM42y60VJu2ke


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.guy8n.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolsMenufacture = client.db('tool_menufactures').collection('product_tools')
        app.get('/service', async (req, res) => {
            const query = {};
            const result = toolsMenufacture.find(query)
            const services = await result.toArray();
            res.send(services)
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