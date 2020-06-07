const https = require('https')
const { Router } = require('express')
const router = Router()
require('dotenv').config()

router.get('/weather/:param', (requ, resp) => {
	const lat = process.env.WEATHER_LAT
	const lon = process.env.WEATHER_LON
	const unitSystem = process.env.WEATHER_UNITS === 'us' ? 'us' : 'si'
	const fields = process.env.WEATHER_FIELDS
	const apiKey = process.env.WEATHER_API_KEY
	let urlPath = ''
	if (requ.params.param === 'realtime') {
		urlPath = `realtime?lat=${lat}&lon=${lon}&unit_system=${unitSystem}&fields=${fields}&apikey=${apiKey}`
	} else {
		urlPath = `forecast/daily?lat=${lat}&lon=${lon}&unit_system=${unitSystem}&fields=temp,weather_code&apikey=${apiKey}`
	}
	https.get(`https://api.climacell.co/v3/weather/${urlPath}`, (res) => {
		const { statusCode } = res
		const contentType = res.headers['content-type']

		let error
		if (statusCode !== 200) {
			error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`)
		} else if (!/^application\/json/.test(contentType)) {
			error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`)
		}
		if (error) {
			console.error(error.message)
			// consume response data to free up memory
			res.resume()
			// return empty array as response so that the request doesn't hang
			resp.json([])
			return
		}

		res.setEncoding('utf8')
		let rawData = ''

		res.on('data', (chunk) => { rawData += chunk })
		res.on('end', () => {
			try {
				const parsedData = JSON.parse(rawData)
				resp.json(parsedData)
			} catch (e) {
				console.error(e.message)
			}
		})
	}).on('error', (e) => {
		console.error(`Got error: ${e.message}`)
	})
})

module.exports = router
