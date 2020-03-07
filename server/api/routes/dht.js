const { Router } = require('express')
const router = Router()
const sensor = require('node-dht-sensor')
require('dotenv').config()

router.get('/dht', (requ, resp) => {
	// sensor.initialize({
	// 	test: {
	// 		fake: {
	// 			temperature: Math.floor(Math.random() * Math.floor(40)),
	// 			humidity: Math.floor(Math.random() * Math.floor(100))
	// 		}
	// 	}
	// })
	sensor.read(11, 4, function(err, temperature, humidity) {
		if (!err) {
			resp.json({
				temp: temperature,
				humidity
			})
		} else {
			console.error(err.message)
			resp.json({
				temp: '~',
				humidity: '~'
			})
		}
	})
})

module.exports = router
