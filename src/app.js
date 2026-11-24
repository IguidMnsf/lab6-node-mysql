const express = require('express');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'API produits MySQL' }));
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));
app.use(errorHandler);
module.exports = app;
