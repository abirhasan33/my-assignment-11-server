const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.POST || 5000;


//middlewer
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.DB_PASS}@cluster0.mu0hx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('assignment-11').collection('service');
        const orderCollection = client.db('assignment-11').collection('order');

        // AUTH 
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCES_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })



        app.get('/service', async(req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/service/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });


        // POST
        app.post('/addnewitem', async (req, res) => {
            const newService = req.body;
            const result = await orderCollection.insertOne(newService);
            res.send({success: 'success full'});
        });


         // DELETE
         app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });

        // PUT 
        app.put('/service/:id', async(req, res)=> {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const quantit = req.body.quantity;
            const option = {upserd: true}
            const quantityMinus = {
                $set: {
                    quantity: quantit
                }
            }
            
            const quantityUpedate = await serviceCollection.updateOne(query, quantityMinus, option);
            res.send({quantityUpedate})
        });


        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
        });


        // delete
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

    }
    finally{

    }
}

run().catch(console.dir);




app.get('/', (req, res)=> {
  res.send("Running assignment-11-server");  
});

app.listen(port, () => {
    console.log("Listening to port");
});