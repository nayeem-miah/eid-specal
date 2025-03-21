const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

// Middleware
app.use(cors({
  origin: ["http://localhost:5173","https://eid-special-react-update.netlify.app"],
  credentials: true, 
}));
app.use(express.json());
app.use(cookieParser());




// MONGODB
  // const uri ='mongodb://localhost:27017'
  const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bomlehy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
      const userCollection = client.db("eidSpecial").collection("users");
      const clothCollection = client.db("eidSpecial").collection("cloths");
      const cartCollection = client.db("eidSpecial").collection("addToCart");

     // **🔹 Signup API**
    app.post("/api/auth/signup", async (req, res) => {
    try {
    const { username, email, password } = req.body;
    const existingUser = await userCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, email, password: hashedPassword };
    // console.log(newUser);
    const result = await userCollection.insertOne(newUser);
    res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
    });

    app.post('/api/auth/login', async (req, res) => {
      try {
          const { email, password } = req.body;
          const user = await userCollection.findOne({ email });
  
          if (!user) {
              return res.status(400).json({ message: "User not found!" });
          }
  
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
              return res.status(400).json({ message: "Password does not match!" });
          }
  
          // Token generation 
          const token = jwt.sign(
              { 
                  user_id: user._id,
                  username: user.username, 
                  email: user.email,
              },
              process.env.JWT_SECRET,
              { expiresIn: "1d" }
          );
  
          res.cookie("token", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
          });
  
          res.json({
              message: "Login successful!",
              user: { _id: user._id, username: user.username, email: user.email }
          });
      } catch (error) {
          console.error("Login Error:", error);
          res.status(500).json({ message: "Internal server error!" });
      }
  });
  



      // logout
      app.post("/api/auth/logout", async (req, res) => {
        res.clearCookie("token")
        // console.log("success logout");
        res.json({message: "logout successfully🙌"})
      })
     // Protected route to check authentication
    app.get("/api/auth/protected", (req, res) => {
      const token = req.cookies.token; 
      if (!token) {
          return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify the token
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
              return res.status(401).json({ message: "Invalid token" });
          }
          
          res.json({
              message: "User is authenticated",
              user: {
                  user_id: decoded.user_id,    
                  username: decoded.username,   
                  email: decoded.email,         
              }
          });
      });
    });
      
      
    app.get('/cloths', async (req, res) => {
      const search = req.query.search || "";
  
      const query = search
          ? {
              $or: [
                  { name: { $regex: search, $options: "i" } },
                  { brand: { $regex: search, $options: "i" } },
                  { category: { $regex: search, $options: "i" } },
              ],
          }
          : {}; 
  
      const result = await clothCollection.find(query).toArray();
      res.send(result);
  });
  
      // get single cloth
      app.get('/single-product/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await clothCollection.findOne(query);
        // console.log(result);
        res.send(result);
      })

      // add to cart product
      app.post('/carts', async (req, res) => {
        const cart = req.body;
        // console.log(cart);
        const result = await cartCollection.insertOne(cart);
        res.send(result);
      })
      // get all added product
      app.get('/carts', async (req, res) => {
        const result = await cartCollection.find().toArray();
        res.send(result);
      })
      
      // get single added product
      app.get('/cart/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const result = await cartCollection.find(query).toArray();
        // console.log(result);
        res.send(result);
      })

      // delete added product
      app.delete('/cart-delete/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await cartCollection.deleteOne(query);
        // console.log(result);
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

app.get("/", (req, res) => {
    res.send("Hello World! from eid-special");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

