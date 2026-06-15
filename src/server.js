const express = require("express");
const dotenv= require("dotenv");



const connectDB= require("./config/db")

const authRoutes = require("./routes/authRoutes");

dotenv.config();
connectDB()
 
const app= express();


app.use(express.json());


app.get("/", (req, res)=>{
    res.send("Taskforce Api Running")
}); 

const Port = process.env.Port || 5000;

app.use("/api/auth", authRoutes);

app.listen(Port, ()=>
{
    console.log(`server running on port ${Port}`);
});

