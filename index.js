const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
 const cors = require('cors');
 const swaggerUi = require('swagger-ui-express');
const swagger = require('./swagger.json');
const dotenv= require('dotenv');
dotenv.config();
const connection = process.env.MONGODB_URI ;
const port = process.env.PORT ;
const app = express();
const errorHandling = require('./Middleware/errorHandler');
const AllRoutes = require('./Routes/app');

 app.use(cors({
    origin: ["http://localhost:3000","http://localhost:5174","https://menyarwanda.vercel.app"],
     credentials: true,
     allowedHeaders: ['Content-Type', 'Authorization'],
     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
 }));
 
 
app.use(express.json());
app.use(cookieParser());
app.use('/MenyaRwandaSwagger', swaggerUi.serve, swaggerUi.setup(swagger))

mongoose.connect(connection)
.then(() => {
    app.listen(port, () =>{
        console.log("Mongo DB connected....")
        console.log(`Server running on ${port}...`);
    })
})
.catch((err) => console.log(err));

 app.use('/api', AllRoutes);
app.use(errorHandling);
