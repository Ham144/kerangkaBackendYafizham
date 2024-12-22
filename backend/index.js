const express = require('express');
require('dotenv').config();
const connectDB = require('./utils/connectDB')

const app = express();

// Middleware
app.use(express.json());

// Koneksi ke MongoDB
connectDB();

// Routes
app.use('/api', require('./routes/userRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
