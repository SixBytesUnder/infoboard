<template>
	<div class="col-12 col-sm-6">
		<div class="row">
			<div
				v-if="weather && weather.temperature"
				class="col weather pr-0">
				<div class="media px-2 float-right withBackground">
					<img
						id="weather-icon"
						:src="weather.weatherCode ? loadImage(`images/${weather.weatherCode}.svg`) : loadImage('images/missing.svg')"
						:alt="weather.weatherCode"
						class="align-self-center mr-2"
						@click="toggleForecast">
					<div class="media-body my-2">
						<p>
							<img
								:alt="locationName"
								src="~/assets/images/pin.svg"
								class="location-icon">
							{{ locationName }}
						</p>
						<p class="display-4">
							{{ roundValue(weather.temperature) }}&deg;{{ units.temperature.charAt() }}
						</p>
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
						<small>
							<a
								href="https://www.climacell.co/"
								target="_blank">
								Powered by ClimaCell
							</a>
						</small>
						<small>Updated on: {{ updated }}</small>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import moment from 'moment'
import units from '~/data/units'

export default {
	data() {
		return {
			locationName: process.env.WEATHER_LOCATION_NAME || '',
			timeFormat: process.env.TIME_FORMAT,
			tempRouded: process.env.WEATHER_ROUNDED === 'true',
			showForecast: false,
			weather: {},
			updated: '',
			units: process.env.WEATHER_UNITS === 'imperial' ? units.imperial : units.metric,
			moment
		}
	},
	mounted() {
		this.getWeather()
		this.interval = setInterval(this.getWeather, 300000)
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
					this.weather = response.data[0].intervals[0].values
					this.$emit('weather-more', response.data)
					if (process.env.AE_WEATHER_DETAILS === 'true') {
						this.$emit('weather-more-show')
					}
					if (process.env.AE_FORECAST === 'true') {
						this.$emit('show-forecast')
					}
					this.updated = moment(response.data[0].intervals[0].startTime).format(this.timeFormat)
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
.weather p {
	margin-bottom: 0;
}
.weather small {
	font-size: 0.4rem;
	margin-top: -10px;
}
.weather small a {
	color: #fff;
}
.location-icon {
	height: 1.1em;
}
#weather-icon {
	width: 10rem;
}
.smaller {
	font-size: 0.6rem;
}

.forecast {
	text-align: center;
}
.forecastIcon img {
	width: 50%;
}
@media (max-width: 575.98px) {
	#weather-icon {
		width: 6rem;
	}
	.forecastWrapper {
		min-width: 45%;
	}
}
</style>
