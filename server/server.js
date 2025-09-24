const express = require('express');
const cors = require('cors');
const storeRoutes = require('./routes/store.routes');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/store', storeRoutes);

module.exports = app;
