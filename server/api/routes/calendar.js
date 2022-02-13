const https = require('https')
const { Router } = require('express')
const router = Router()
const ical = require('ical')
const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')
const advancedFormat = require('dayjs/plugin/advancedFormat')
const duration = require('dayjs/plugin/duration')
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(isBetween)
dayjs.extend(advancedFormat)
dayjs.extend(duration)
dayjs.extend(relativeTime)
require('dotenv').config()

function sortByKey(array, key) {
	return array.sort(function(a, b) {
		const x = a[key]
		const y = b[key]
		return ((x < y) ? -1 : ((x > y) ? 1 : 0))
	})
}

router.get('/calendar', (req, resp) => {
	const eventsList = []

	https.get(process.env.CALENDAR_ICAL, (res) => {
		const { statusCode } = res
		if (statusCode === 200) {
			res.setEncoding('utf8')
			let rawData = ''

			res.on('data', (chunk) => { rawData += chunk })
			res.on('end', () => {
				try {
					const events = ical.parseICS(rawData)

					for (const i in events) {
						if (Object.prototype.hasOwnProperty.call(events, i)) {
							const rangeStart = dayjs()
							const rangeEnd = dayjs().add(60, 'day')
							const event = events[i]

							if (event.type === 'VEVENT') {
								const title = event.summary
								let startDate = dayjs(event.start)
								let endDate = dayjs(event.end)

								// Calculate duration of the event for use with recurring events.
								const duration = parseInt(endDate.format('x')) - parseInt(startDate.format('x'))

								// Simple case - no recurrences, just print out the calendar event.
								if (typeof event.rrule === 'undefined' && dayjs(event.end).isBetween(rangeStart, rangeEnd)) {
									eventsList.push({
										title,
										sort: startDate.unix(),
										startDate: startDate.format(process.env.CALENDAR_DATE_FORMAT),
										startTime: startDate.format(process.env.CALENDAR_TIME_FORMAT),
										endDate: endDate.format(process.env.CALENDAR_DATE_FORMAT),
										endTime: endDate.format(process.env.CALENDAR_TIME_FORMAT),
										duration: dayjs.duration(duration).humanize()
									})
								} else if (typeof event.rrule !== 'undefined') {
									// Complicated case - if an RRULE exists, handle multiple recurrences of the event.
									// For recurring events, get the set of event start dates that fall within the range of dates we're looking for.
									const dates = event.rrule.between(
										rangeStart.toDate(),
										rangeEnd.toDate(),
										true,
										function(date, i) { return true }
									)
									// The "dates" array contains the set of dates within our desired date range range that are valid
									// for the recurrence rule.  *However*, it's possible for us to have a specific recurrence that
									// had its date changed from outside the range to inside the range.  One way to handle this is
									// to add *all* recurrence override entries into the set of dates that we check, and then later
									// filter out any recurrences that don't actually belong within our range.
									if (event.recurrences !== undefined) {
										for (const r in event.recurrences) {
											// Only add dates that weren't already in the range we added from the rrule so that we don't double-add those events.
											if (dayjs(new Date(r)).isBetween(rangeStart, rangeEnd) !== true) {
												dates.push(new Date(r))
											}
										}
									}
									// Loop through the set of date entries to see which recurrences should be printed.
									for (const i in dates) {
										const date = dates[i]
										let curEvent = event
										let showRecurrence = true
										let curDuration = duration

										startDate = dayjs(date)

										// Use just the date of the recurrence to look up overrides and exceptions (i.e. chop off time information)
										const dateLookupKey = date.toISOString().substring(0, 10)

										// For each date that we're checking, it's possible that there is a recurrence override for that one day.
										if ((curEvent.recurrences !== undefined) && (curEvent.recurrences[dateLookupKey] !== undefined)) {
											// We found an override, so for this recurrence, use a potentially different title, start date, and duration.
											curEvent = curEvent.recurrences[dateLookupKey]
											startDate = dayjs(curEvent.start)
											curDuration = parseInt(dayjs(curEvent.end).format('x')) - parseInt(startDate.format('x'))
										} else if ((curEvent.exdate !== undefined) && (curEvent.exdate[dateLookupKey] !== undefined)) {
											// If there's no recurrence override, check for an exception date.  Exception dates represent exceptions to the rule.
											// This date is an exception date, which means we should skip it in the recurrence pattern.
											showRecurrence = false
										}

										// Set the the title and the end date from either the regular event or the recurrence override.
										const recurrenceTitle = curEvent.summary
										endDate = dayjs(parseInt(startDate.format('x')) + curDuration, 'x')

										// If this recurrence ends before the start of the date range, or starts after the end of the date range,
										// don't process it.
										if (endDate.isBefore(rangeStart) || startDate.isAfter(rangeEnd)) {
											showRecurrence = false
										}

										if (showRecurrence === true) {
											eventsList.push({
												title: recurrenceTitle,
												sort: startDate.unix(),
												startDate: startDate.format(process.env.CALENDAR_DATE_FORMAT),
												startTime: startDate.format(process.env.CALENDAR_TIME_FORMAT),
												endDate: endDate.format(process.env.CALENDAR_DATE_FORMAT),
												endTime: endDate.format(process.env.CALENDAR_TIME_FORMAT),
												duration: dayjs.duration(duration).humanize()
											})
										}
									}
								}
							}
						}
					}
					// sort our results by start date, before returning and limit returned list
					resp.json(sortByKey(eventsList, 'sort').slice(0, process.env.CALENDAR_LIMIT))
				} catch (e) {
					console.error(e.message)
				}
			})
		}
	}).on('error', (e) => {
		console.error(e.message)
	})
})

module.exports = router
