const fs = require('fs')
const path = require('path')
const https = require('https')
const { Router } = require('express')
const router = Router()
require('dotenv').config()

router.get('/nasa', (requ, resp) => {
	const apiKey = process.env.NASA_KEY
	// check if we have local copy of the file
	https.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&hd=true`, (res) => {
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
				const parsedData = JSON.parse(rawData)
				const filePath = path.join(__dirname, '..', '..', '..', 'assets', 'nasa', `${parsedData.date}.jpg`)
				fs.access(filePath, fs.constants.F_OK, (err) => {
					if (err) {
						// file doen't exist, download it
						if (parsedData.media_type === 'image') {
							const file = fs.createWriteStream(filePath)
							https.get(parsedData.hdurl, (response) => {
								response.pipe(file)
								resp.json(`${parsedData.date}.jpg`)
							})
						}
					} else {
						// file exists
						resp.json(`${parsedData.date}.jpg`)
					}
				})
			} catch (e) {
				console.error(e.message)
			}
		})
	}).on('error', (e) => {
		console.error(`Got error: ${e.message}`)
	})
})

module.exports = router
