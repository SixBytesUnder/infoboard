const { Router } = require('express')
const router = Router()
const sensor = require('node-dht-sensor')
require('dotenv').config()
const sensorType = process.env.TH_SENSOR_TYPE
const pinNo = process.env.TH_GPIO_PIN

router.get('/dht', (requ, resp) => {
	// sensor.initialize({
	// 	test: {
	// 		fake: {
	// 			temperature: Math.floor(Math.random() * Math.floor(40)),
	// 			humidity: Math.floor(Math.random() * Math.floor(100))
	// 		}
	// 	}
	// })
	sensor.read(sensorType, pinNo, function(err, temperature, humidity) {
		if (!err) {
			resp.json({
				temperature,
				humidity
			})
		} else {
			console.error(err.message)
			resp.json({
				temperature: '~',
				humidity: '~'
			})
		}
	})
})

module.exports = router
