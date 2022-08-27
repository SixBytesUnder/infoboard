const https = require('https')
const { Router } = require('express')
const router = Router()
require('dotenv').config()

router.get('/weather', (requ, resp) => {
	const lat = process.env.WEATHER_LAT
	const lon = process.env.WEATHER_LON
	const units = process.env.WEATHER_UNITS === 'imperial' ? 'imperial' : 'metric'
	const fields = process.env.WEATHER_FIELDS.split(',')
	const apiKey = process.env.WEATHER_API_KEY

	const credentials = JSON.stringify({
		location: `${lat},${lon}`,
		fields,
		timesteps: ['current', '1d'],
		units
	})

	const options = {
		method: 'POST',
		host: 'api.tomorrow.io',
		port: 443,
		path: '/v4/timelines',
		headers: {
			'Content-Type': 'application/json',
			apikey: apiKey
		}
	}

	const req = https.request(options, (res) => {
		let body = []
		res.on('data', (chunk) => {
			body.push(chunk)
		})
		res.on('end', () => {
			try {
				body = JSON.parse(Buffer.concat(body).toString())
				resp.json(body.data.timelines)
			} catch (error) {
				console.error(error)
				resp.json({ error: 'check console' })
			}
		})
	})
	req.on('error', (error) => {
		console.error(error)
	})
	req.write(credentials)
	req.end()
})

module.exports = router
