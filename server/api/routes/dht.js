const { Router } = require('express')
const router = Router()
const sensor = require('node-dht-sensor')
require('dotenv').config()
sensor.initialize({
	test: {
		fake: {
			temperature: 21,
			humidity: 60
		}
	}
})

router.get('/dht', (requ, resp) => {
	// resp.json({ asd: true })
	sensor.read(11, 4, function (err, temperature, humidity) {
		if (!err) {
			// console.log(`temp: ${temperature}°C, humidity: ${humidity}%`)
			resp.json({
				temp: temperature,
				humidity: humidity
			})
			// resp.json(`temp: ${temperature}°C, humidity: ${humidity}%`)
		} else {
			console.error(err.message)
			// return epty array as response so that the request doesn't hang
			resp.json([])
		}
	})
})

module.exports = router
