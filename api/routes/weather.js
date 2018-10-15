const {Router} = require('express')
const router = Router()
const https = require('https')
require('dotenv').config()

router.get('/weather', (requ, resp) => {
	let location = process.env.WEATHER_LOCATION
	let apiKey = process.env.WEATHER_API_SECRET
	let units = process.env.WEATHER_UNITS === 'fahrenheit' ? 'us' : 'si'
	https.get(`https://api.darksky.net/forecast/${apiKey}/${location}/?exclude=minutely,hourly&units=${units}`, (res) => {
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
			// return epty array as response so that the request doesn't hang
			resp.json([])
			return
		}

		res.setEncoding('utf8')
		let rawData = ''

		res.on('data', (chunk) => { rawData += chunk })
		res.on('end', () => {
			try {
				let parsedData = JSON.parse(rawData)
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
