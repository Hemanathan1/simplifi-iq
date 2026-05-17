require('dotenv').config();
const express = require('express');
const { createLogger, transports, format } = require('winston');
const leadRoutes   = require('./api/routes');
const previewRoute = require('./pdf/preview');

const app = express();
const PORT = process.env.PORT || 3000;

// Logger
const logger = createLogger({
  format: format.combine(format.timestamp(), format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', leadRoutes);
app.use('/api', previewRoute);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  logger.info(`SimplifIQ server running on port ${PORT}`);
});

module.exports = { app, logger };
