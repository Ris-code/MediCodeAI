import express from "express";
import router from './routes/routes.js'; 
import dotenv from 'dotenv';
dotenv.config();

const app = express()

const PORT = process.env.PORT;

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else
        console.log("Error occurred, server can't start", error)
});
console.log(router)
app.use('/api', router);

