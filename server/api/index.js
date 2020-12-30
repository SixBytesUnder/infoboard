// Require API routes
const express = require('express')
const background = require('./routes/background')
const weather = require('./routes/weather')
const nasa = require('./routes/nasa')
const calendar = require('./routes/calendar')
const tfl = require('./routes/tfl')
const dht = require('./routes/dht')
const sds = require('./routes/sds')

// Create express instnace
const app = express()

// Import API Routes
app.use(background)
app.use(weather)
app.use(nasa)
app.use(calendar)
app.use(tfl)
app.use(dht)
app.use(sds)

// Export the server middleware
module.exports = {
	path: '/api',
	handler: app
}
