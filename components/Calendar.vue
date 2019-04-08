<template>
	<div
		v-if="enable === 'true'"
		class="col">
		<div class="row">
			<div class="col mx-2">
				<div
					v-if="showCalendarIcon"
					class="row justify-content-end p-2">
					<div class="p-2 mr-2 withBackground">
						<img
							id="calendar-icon"
							src="/images/calendar.svg"
							alt="Calendar"
							@click="toggleCalendar">
					</div>
				</div>
				<div
					v-if="showCalendar"
					class="row justify-content-end"
					@click="toggleCalendar">
					<div class="col-8 p-2 mr-3 withBackground">
						<p>Upcoming calendar events:</p>
						<div
							v-for="(events, day) in eventsList"
							:key="day"
							class="col border-top">
							<div class="col-12 px-0">
								{{ day === moment().format(dateFormat) ? 'Today' : day }}
							</div>
							<div
								v-for="(ev, index) in events"
								:key="index"
								class="row">
								<div class="col-3 border-right">
									<small>{{ ev.time }}</small>
								</div>
								<div class="col-9">
									{{ ev.summary }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'

export default {
	data: function () {
		return {
			moment: moment,
			env: process.env.NODE_ENV,
			enable: process.env.CALENDAR_ENABLE,
			dateFormat: 'YYYY-MM-DD',
			eventsList: {},
			showCalendar: false,
			showCalendarIcon: true
		}
	},
	mounted() {
		this.dateFormat = process.env.CALENDAR_DATE_FORMAT === '' || process.env.CALENDAR_DATE_FORMAT === undefined ? 'YYYY-MM-DD' : process.env.CALENDAR_DATE_FORMAT
		this.getEvents()
		this.interval = setInterval(this.getEvents, 1000 * 3600)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		getEvents() {
			axios.get('/api/calendar')
				.then((response) => {
					const eventsList = {}
					let end = ''
					response.data.map((item, i) => {
						const date = moment(item.time).format(this.dateFormat)
						const time = moment(item.time).format('HH:mm')
						if (item.end === '') {
							end = ''
						} else {
							end = moment(item.end).format('HH:mm')
						}
						if (typeof eventsList[date] === 'undefined') eventsList[date] = []
						if (time === '00:00') {
							eventsList[date].push({ time: 'all-day', summary: item.summary })
						} else {
							eventsList[date].push({ time: time + '-' + end, summary: item.summary })
						}
					})
					this.eventsList = eventsList
				})
				.catch((err) => {
					if (this.env === 'development') console.log(err)
				})
		},
		toggleCalendar() {
			this.showCalendar = !this.showCalendar
			this.showCalendarIcon = !this.showCalendarIcon
		}
	}
}
</script>

<style scoped>
#calendar-icon {
	min-width: 10%;
	width: 4rem;
}
small {
	font-size: 60%;
}
.border-top, .border-right {
	border-width: 0.5px !important;
}
</style>
