<template>
	<div class="col-12 col-sm-6">
		<div
			v-if="weather && weather.temperature"
			class="row py-2 ms-auto withBackground weather">
			<div class="col">
				<img
					id="weather-icon"
					:src="weather.weatherCode ? loadImage(`images/${weather.weatherCode}.svg`) : loadImage('images/missing.svg')"
					:alt="weather.weatherCode"
					class="flex-shrink-0 align-self-center"
					@click="toggleForecast">
			</div>
			<div class="col">
				<p>
					<img
						:alt="locationName"
						src="~/assets/images/pin.svg"
						class="location-icon">
					{{ locationName }}
				</p>
				<h5 class="my-0 display-4">
					{{ roundValue(weather.temperature) }}&deg;{{ units.temperature.charAt() }}
				</h5>
				<p class="smaller">
					Feels like
					{{ roundValue(weather.temperatureApparent) }}&deg;{{ units.temperatureApparent.charAt() }}
				</p>
				<p class="d-flex justify-content-between align-items-center">
					{{ units.weatherCode[weather.weatherCode] }}
					<button
						class="btn btn-sm btn-outline-light"
						@click="toggleMoreInfo">
						more
					</button>
				</p>
				<p class="small">
					<a
						href="https://www.tomorrow.io/"
						target="_blank">
						Powered by Tomorrow.io</a>
					Updated:{{ updated }}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import dayjs from 'dayjs'
import units from '~/data/units'

export default {
	name: 'WeatherWidget',
	data() {
		return {
			locationName: process.env.WEATHER_LOCATION_NAME || '',
			timeFormat: process.env.TIME_FORMAT,
			tempRouded: process.env.WEATHER_ROUNDED === 'true',
			refresh: process.env.WEATHER_REFRESH || 300000,
			showForecast: false,
			weather: {},
			updated: '',
			units: process.env.WEATHER_UNITS === 'imperial' ? units.imperial : units.metric,
			dayjs
		}
	},
	mounted() {
		this.getWeather()
		this.interval = setInterval(this.getWeather, this.refresh)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		loadImage(path) {
			return require(`~/assets/${path}`)
		},
		toggleForecast() {
			this.$emit('show-forecast', !this.showForecast)
		},
		toggleMoreInfo() {
			this.$emit('weather-more-show')
		},
		getWeather() {
			// get current weather and forecast
			this.$axios.get('/weather')
				.then((response) => {
					// pick current weather
					const current = response.data.find(element => element.timestep === 'current')
					this.weather = current.intervals[0].values
					this.$emit('weather-more', response.data)
					if (process.env.AE_WEATHER_DETAILS === 'true') {
						this.$emit('weather-more-show')
					}
					if (process.env.AE_FORECAST === 'true') {
						this.$emit('show-forecast')
					}
					this.updated = dayjs(current.intervals[0].startTime).format(this.timeFormat)
				})
				.catch((err) => {
					console.error(err)
				})
		},
		roundValue(val) {
			if (this.tempRouded) {
				return Math.round(val)
			} else {
				return val
			}
		}
	}
}
</script>

<style scoped>
.card {
	background-color: transparent;
}
#weather-icon {
	width: 10rem;
}
.weather p {
	margin-bottom: 0;
}
.smaller {
	font-size: .6rem;
}
.small {
	font-size: 0.5rem;
}
.small a {
	color: #fff;
}
.location-icon {
	height: 1.1em;
}
</style>
