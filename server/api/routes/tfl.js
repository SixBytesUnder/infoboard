const axios = require('axios')
const { Router } = require('express')
const router = Router()
require('dotenv').config()

router.get('/tfl', (requ, resp) => {
	const appId = process.env.TFL_APP_ID
	const appKey = process.env.TFL_APP_KEY
	const busStops = process.env.TFL_BUS_STOPS.split(',')
	const statusLines = process.env.TFL_STATUS
	const tflData = {
		tube: {},
		buses: {}
	}

	axios.get(`https://api.tfl.gov.uk/line/mode/${statusLines}/status?app_id=${appId}&app_key=${appKey}`)
		.then((res) => {
			if (res.status === 200) {
				for (let i = 0; i < res.data.length; i++) {
					tflData.tube[res.data[i].id] = {
						id: res.data[i].id,
						name: res.data[i].name
					}
					// iterate through statuses
					for (let j = 0; j < res.data[i].lineStatuses.length; j++) {
						const lineStatus = res.data[i].lineStatuses[j]
						tflData.tube[res.data[i].id].lineStatuses = {
							statusSeverity: lineStatus.statusSeverity,
							statusSeverityDescription: lineStatus.statusSeverityDescription
						}
					}
				}
			} else if (process.env.NODE_ENV === 'development') {
				console.error(res.message)
			}
		})
		.catch((error) => {
			console.error(error)
		})
		.then((res) => {
			busStops.reduce(async(previousPromise, nextElement) => {
				await previousPromise
				return new Promise((resolve, reject) => {
					axios.get(`https://api.tfl.gov.uk/StopPoint/${nextElement}/Arrivals?app_id=${appId}&app_key=${appKey}`)
						.then((res) => {
							if (res.status === 200) {
								for (let i = 0; i < res.data.length; i++) {
									let timetable = ''
									const stopName = `${res.data[i].stationName} ↦ ${res.data[i].destinationName}`

									if (typeof res.data[i].timeToStation === 'number') {
										timetable = Math.round(res.data[i].timeToStation / 60)
										if (timetable <= 0.4) {
											timetable = 'Due'
										}
									} else {
										timetable = res.data[i].timeToStation
									}

									if (tflData.buses[stopName] === undefined) {
										tflData.buses[stopName] = {}
									}
									if (tflData.buses[stopName][res.data[i].lineName] === undefined) {
										tflData.buses[stopName][res.data[i].lineName] = []
									}
									if (!tflData.buses[stopName][res.data[i].lineName].includes(timetable)) {
										tflData.buses[stopName][res.data[i].lineName].push(timetable)
									}
									tflData.buses[stopName][res.data[i].lineName].sort((a, b) => a - b)
								}
								resolve(nextElement)
							} else {
								console.error(res.message)
								reject(res.message)
							}
						})
						.catch((err) => {
							if (process.env.NODE_ENV === 'development') { console.error(err) }
							reject(err)
						})
				})
			}, Promise.resolve())
				.then(() => {
					resp.json(tflData)
				})
		})
		.catch((error) => {
			console.error(error)
		})
})

module.exports = router
