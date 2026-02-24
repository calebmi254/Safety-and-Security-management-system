const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow CDNs for Bootstrap/Fonts
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Root route - serve landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Import and use routes
const authRoutes = require('./modules/auth/auth.routes');
const officeRoutes = require('./modules/offices/offices.routes');
const userRoutes = require('./modules/users/users.routes');
const locationRoutes = require('./modules/locations/location.routes');
const riskRoutes = require('./modules/risks/risk.routes');

app.use('/api/auth', authRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/risks', riskRoutes);

// Error Handling (Must be last)
app.use(errorMiddleware);

module.exports = app;
