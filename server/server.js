const express = require("express")
const myRoute = require('./routes/routes.js'); 
require('dotenv').config();

const app = express()

const PORT = process.env.PORT;

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else
        console.log("Error occurred, server can't start", error)
});

app.use('/api', myRoute);

