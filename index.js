const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jerinsparlour.0gavi6r.mongodb.net/?retryWrites=true&w=majority&appName=jerinsparlour`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("parlourDB").collection("users");
    const servicesCollection = client.db("parlourDB").collection("services");
    const reviewsCollection = client.db("parlourDB").collection("reviews");
    const teamCollection = client.db("parlourDB").collection("team");
    const bookingsCollection = client.db("parlourDB").collection("bookings");

    // Users related api
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };

      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Services related api
    app.get("/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });

    app.put("/services/:id", async (req, res) => {
      const id = req.params.id;
      const service = req.body;
      const filter = { _id: new ObjectId(id) };

      const updatedService = {
        $set: {
          heading: service.heading,
          description: service.description,
          price: service.price,
        },
      };

      const result = await servicesCollection.updateOne(filter, updatedService);
      res.send(result);
    });

    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    });

    // Reviews related api
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // Team Member related api
    app.get("/team", async (req, res) => {
      const result = await teamCollection.find().toArray();
      res.send(result);
    });

    //Bookings related api
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = email ? { email: email } : {};
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      booking.status = "Pending";
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    app.put("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = { $set: { status } };

      const result = await bookingsCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // Payment related api
    app.post("/create-payment-intent", async (req, res) => {
      const { amount } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Admin related api
    app.patch("/make-admin", async (req, res) => {
      const { email } = req.body;

      const query = { email };
      const user = await usersCollection.findOne(query);

      if (!user) {
        return res
          .status(404)
          .send({ message: "User not found. Please sign up." });
      }

      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(query, updateDoc);

      if (result.modifiedCount > 0) {
        res.send({ message: "User has been made an admin." });
      } else {
        res.status(500).send({ message: "Failed to make the user an admin." });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Jerins Parlour Server is running");
});

app.listen(port, () => {
  console.log(`Jerins Parlour server is running on port: ${port}`);
});
