require('dotenv').config();
const express = require('express');
const { logger } = require('./logger');
const leadRoutes   = require('./api/routes');
const previewRoute = require('./pdf/preview');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api', leadRoutes);
app.use('/api', previewRoute);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  logger.info(`SimplifIQ server running on port ${PORT}`);
});

module.exports = { app };