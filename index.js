const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swagger = require('./swagger.json');
const dotenv = require('dotenv');
dotenv.config();

//mongodb://iriscredotteta:Niwenshuti250@ac-9q9mfo1-shard-00-00.qexuxqn.mongodb.net:27017,ac-9q9mfo1-shard-00-01.qexuxqn.mongodb.net:27017,ac-9q9mfo1-shard-00-02.qexuxqn.mongodb.net:27017/RwandaMenya?ssl=true&replicaSet=atlas-by4k1l-shard-0&authSource=admin&appName=Cluster0

const connection = process.env.MONGODB_URI;
const port = process.env.PORT;
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || "https://menyarwanda-backend.onrender.com";

const app = express();
const errorHandling = require('./Middleware/errorHandler');
const AllRoutes = require('./Routes/app');

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5174",
    "https://menyarwanda-frontend.onrender.com"
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(cookieParser());
app.use('/MenyaRwandaSwagger', swaggerUi.serve, swaggerUi.setup(swagger));

// ── Health check endpoint ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', AllRoutes);
app.use(errorHandling);

mongoose.connect(connection)
  .then(() => {
    app.listen(port, () => {
      console.log("MongoDB connected....");
      console.log(`Server running on ${port}...`);

      // ── Keep-alive ping (every 14 min so Render never sleeps) ──────────
      setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/health`);
          console.log(`🏓 Keep-alive ping → ${res.status}`);
        } catch (err) {
          console.error("⚠️  Keep-alive failed:", err.message);
        }
      }, 14 * 60 * 1000);

    });
  })
  .catch((err) => console.log(err));
