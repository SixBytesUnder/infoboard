try {
	const imu = require('node-sense-hat').Imu
	const { Router } = require('express')
	const router = Router()
	require('dotenv').config()

	const IMU = new imu.IMU()

	router.get('/sensehat', (req, res) => {
		if (process.env.NODE_ENV !== 'development') {
			IMU.getValue((err, data) => {
				if (err !== null) {
					console.error(`Could not read sensor data: ${err}`)
					res.json({
						temperature: 0,
						pressure: 0,
						humidity: 0
					})
				} else {
					res.json({
						temperature: data.temperature,
						pressure: data.pressure,
						humidity: data.humidity
					})
				}
			})
		}
	})

	module.exports = router
} catch (e) {
	const { Router } = require('express')
	const router = Router()

	router.get('/sensehat', (req, res) => {
		res.json({
			temperature: 0,
			pressure: 0,
			humidity: 0
		})
	})

	module.exports = router
}
