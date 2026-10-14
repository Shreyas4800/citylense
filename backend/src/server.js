const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.get('/', (req, res) => {
    res.status(200).json({ status: 'ONLINE', service: 'CityLense Core Spatial API' });
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`CityLense Core Active on port ${PORT}`);
});