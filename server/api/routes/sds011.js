const { Router } = require('express')
const router = Router()
const SDS011Wrapper = require('sds011-wrapper')
const sensor = new SDS011Wrapper('COM5')
require('dotenv').config()

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
						full: data,
						pm25: data['PM2.5'],
						pm10: data.PM10
					})
					console.log(`Received: ` + JSON.stringify(data))
				})
		})
})

module.exports = router
