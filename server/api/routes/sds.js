/**
 * https://gist.github.com/marians/dde90d448e4c6f9d850102067ab0f842
 * https://dev.to/minkovsky/working-on-my-iot-air-quality-monitoring-setup-40a5
 * https://raspberrypi.stackexchange.com/questions/88079/get-the-dev-tty-for-raspberry-pi
 * custom sds wrapper using serial package
 * https://github.com/ikhayainkomishi/node-red-contrib-sds011/blob/master/sds011-node/sds011-node.js
 * npm install sds011-wrapper
 * or
 * npm install serialport
 * npm install nova-sds011
 */
try {
	const SDS011Wrapper = require('sds011-wrapper')
	const { Router } = require('express')
	const router = Router()
	require('dotenv').config()
	// COM5 is for Windows; RPi will be ttyUSB0 or ttyUSB1...
	const port = process.env.SDS_PORT
	const sensor = new SDS011Wrapper(port)

	router.get('/sds', (requ, resp) => {
		sensor
			.setReportingMode('query')
			.then(() => {
				console.log('Sensor is now working in query mode.')
				return sensor.setWorkingPeriod(1)
			})
			.then(() => {
				console.log('Working period set to 1 minute.')
				console.log('Querying...')
				sensor
					.query()
					.then((data) => {
						resp.json({
							pm25: data['PM2.5'],
							pm10: data.PM10
						})
						console.log('Received: ' + JSON.stringify(data))
					})
			})
	})

	module.exports = router
} catch (e) {
	const { Router } = require('express')
	const router = Router()

	router.get('/sds', (requ, resp) => {
		resp.json({
			pm25: 0,
			pm10: 0
		})
	})

	module.exports = router
}
