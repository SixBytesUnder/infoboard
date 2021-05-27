try {
	const sensor = require('node-dht-sensor')
	const { Router } = require('express')
	const router = Router()
	require('dotenv').config()
	const sensorType = process.env.DHT_SENSOR_TYPE
	const pinNo = process.env.DHT_GPIO_PIN

	router.get('/dht', (requ, resp) => {
		// if we're in dev mode, mock sensor values
		if (process.env.NODE_ENV === 'development') {
			sensor.initialize({
				test: {
					fake: {
						temperature: Math.floor(Math.random() * Math.floor(40)),
						humidity: Math.floor(Math.random() * Math.floor(100))
					}
				}
			})
		}
		sensor.read(sensorType, pinNo, (err, temperature, humidity) => {
			if (!err) {
				resp.json({
					temperature,
					humidity
				})
			} else {
				console.error(err.message)
				resp.json({
					temperature: 0,
					humidity: 0
				})
			}
		})
	})

	module.exports = router
} catch (e) {
	const { Router } = require('express')
	const router = Router()

	router.get('/dht', (requ, resp) => {
		resp.json({
			temperature: 0,
			humidity: 0
		})
	})

	module.exports = router
}
