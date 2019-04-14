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
						<p>
							Upcoming calendar events:
							<a
								v-if="!authorized"
								href="#"
								class="badge badge-dark"
								@click.prevent="handleAuth">
								Sign In
							</a>
							<a
								v-if="authorized"
								href="#"
								class="badge badge-dark"
								@click.prevent="handleSignout">
								Sign Out
							</a>
						</p>
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
import moment from 'moment'
// import { google } from 'googleapis'

export default {
	data: function () {
		return {
			moment: moment,
			env: process.env.NODE_ENV,
			enable: process.env.CALENDAR_ENABLE,
			dateFormat: 'YYYY-MM-DD',
			eventsList: {},
			showCalendar: false,
			showCalendarIcon: true,
			API_KEY: process.env.CALENDAR_API_KEY,
			CLIENT_ID: process.env.CALENDAR_CLIENT_ID,
			DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
			SCOPES: 'https://www.googleapis.com/auth/calendar.readonly',
			authToken: undefined,
			api: undefined,
			authorized: false
		}
	},
	mounted() {
		// eslint-disable-next-line no-undef
		this.api = gapi
		this.handleClientLoad()
		this.dateFormat = process.env.CALENDAR_DATE_FORMAT === '' || process.env.CALENDAR_DATE_FORMAT === undefined ? 'YYYY-MM-DD' : process.env.CALENDAR_DATE_FORMAT
		this.interval = setInterval(this.getEvents, 1000 * 3600)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		saveAuthToken() {
			let saving

			try {
				saving = JSON.stringify(this.authToken)
				localStorage.removeItem('infoboardGCState')
				localStorage.setItem('infoboardGCState', saving)
			} catch (err) {
				if (this.env === 'development') console.log(err)
			}
		},
		loadAuthToken() {
			let loading

			try {
				loading = localStorage.getItem('infoboardGCState')
				if (loading !== null) {
					this.authToken = JSON.parse(loading)
				}
			} catch (err) {
				if (this.env === 'development') console.log(err)
			}
		},
		handleClientLoad() {
			this.api.load('client:auth2', this.initClient)
		},
		initClient() {
			const apiParams = {
				apiKey: this.API_KEY,
				clientId: this.CLIENT_ID,
				discoveryDocs: this.DISCOVERY_DOCS,
				scope: this.SCOPES
			}

			this.api.client.init(apiParams).then(() => {
				this.loadAuthToken()
			}).then(() => {
				// Listen for sign-in state changes.
				this.api.auth2.getAuthInstance().isSignedIn.listen(this.authorized)
				if (this.authToken !== undefined) {
					this.authorized = true
					this.getEvents()
				}
			}, (err) => {
				if (this.env === 'development') console.log(JSON.stringify(err))
			})
		},
		handleAuth(event) {
			Promise.resolve(this.api.auth2.getAuthInstance().signIn())
				.then((token) => {
					this.authToken = token
					this.saveAuthToken()
					this.authorized = true
					this.getEvents()
					this.toggleCalendar()
				})
		},
		handleSignout(event) {
			Promise.resolve(this.api.auth2.getAuthInstance().signOut())
				.then(() => {
					localStorage.removeItem('infoboardGCState')
					this.authorized = false
					this.eventsList = {}
				})
		},
		getEvents() {
			if (this.authorized === true) {
				this.api.client.calendar.events.list({
					'calendarId': 'primary',
					'timeMin': (new Date()).toISOString(),
					'showDeleted': false,
					'singleEvents': true,
					'maxResults': 10,
					'orderBy': 'startTime'
				}).then((response) => {
					const eventsList = {}
					if (response.result.items.length > 0) {
						response.result.items.map((event) => {
							const startTime = event.start.dateTime || event.start.date
							const endTime = moment(event.end.dateTime).format('HH:mm') || ''
							const date = moment(startTime).format(this.dateFormat)
							const time = moment(startTime).format('HH:mm')
							if (typeof eventsList[date] === 'undefined') eventsList[date] = []
							if (time === '00:00') {
								eventsList[date].push({ time: 'all-day', summary: event.summary })
							} else {
								eventsList[date].push({ time: time + '-' + endTime, summary: event.summary })
							}
						})
					} else {
						eventsList.push('No upcoming events found.')
					}
					this.eventsList = eventsList
				})
			}
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
