const express = require('express')

// Create express instnace
const app = express()

// Require API routes
const background = require('./routes/background')
const weather = require('./routes/weather')
const nasa = require('./routes/nasa')
const calendar = require('./routes/calendar')
const dht = require('./routes/dht')
const sds = require('./routes/sds011')

// Import API Routes
app.use(background)
app.use(weather)
app.use(nasa)
app.use(calendar)
app.use(dht)
app.use(sds)

// Export the server middleware
module.exports = {
	path: '/api',
	handler: app
}
