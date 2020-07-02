<template>
	<div
		v-if="enable === true"
		class="col-12 col-sm-6">
		<div class="row">
			<div class="col ml-2">
				<div
					v-if="!showCalendar"
					class="p-2 withBackground">
					<img
						class="calendar-icon"
						src="~/assets/images/calendar.svg"
						alt="Calendar"
						@click="toggleCalendar">
				</div>
				<div
					v-if="showCalendar"
					class="row">
					<div
						class="col-8 p-2 ml-3 withBackground smaller"
						@click="toggleCalendar">
						<p>
							Upcoming calendar events:
						</p>
						<div
							v-for="(events, day) in eventsList"
							:key="day"
							class="col border-top">
							<div class="col-12 px-0">
								{{ isSoon(day) }}
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

export default {
	data() {
		return {
			enable: process.env.CALENDAR_ENABLE === 'true',
			dateFormat: process.env.CALENDAR_DATE_FORMAT,
			eventsList: {},
			showCalendar: false
		}
	},
	mounted() {
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
					if (response.data.length > 0) {
						response.data.map((event) => {
							if (typeof this.eventsList[event.startDate] === 'undefined') {
								this.eventsList[event.startDate] = []
							}
							if (event.startTime === event.endTime) {
								this.eventsList[event.startDate].push({ time: 'all-day', summary: event.title })
							} else {
								this.eventsList[event.startDate].push({ time: `${event.startTime}-${event.endTime}`, summary: event.title })
							}
						})
					} else {
						this.eventsList.push('No upcoming events found.')
					}
					if (process.env.AE_CALENDAR === 'true') {
						this.showCalendar = true
					}
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
		},
		toggleCalendar() {
			this.showCalendar = !this.showCalendar
		},
		isSoon(checkDate) {
			const today = new Date()
			const someDate = new Date(checkDate)
			if (someDate.getMonth() === today.getMonth() && someDate.getFullYear() === today.getFullYear()) {
				if (someDate.getDate() === today.getDate()) {
					return 'Today'
				} else if (someDate.getDate() === today.getDate() + 1) {
					return 'Tomorrow'
				} else {
					return checkDate
				}
			} else {
				return checkDate
			}
		}
	}
}
</script>

<style scoped>
.calendar-icon {
	min-width: 10%;
	width: 4rem;
}
small {
	font-size: 70%;
}
.smaller {
	font-size: 0.75rem;
}
.border-top, .border-right {
	border-width: 0.5px !important;
}
</style>
