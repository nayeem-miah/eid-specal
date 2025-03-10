const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World! from eid-spectal");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

