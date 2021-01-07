<template>
	<div class="col-12 col-sm-6">
		<div class="row">
			<div
				v-if="weather && weather.temp"
				class="col weather pr-0">
				<div class="media px-2 float-right withBackground">
					<img
						id="weather-icon"
						:src="weather.weather_code ? loadImage(`images/${weather.weather_code.value}.svg`) : loadImage('images/missing.svg')"
						:alt="weather.weather_code.value"
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
							{{ roundValue(weather.temp.value) }}&deg;{{ weather.temp.units }}
						</p>
						<p class="smaller">
							Feels like
							{{ roundValue(weather.feels_like.value) }}&deg;{{ weather.feels_like.units }}
						</p>
						<p class="d-flex justify-content-between align-items-center">
							{{ weather.weather_code.value.split('_').join(' ') }}
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

export default {
	data() {
		return {
			locationName: process.env.WEATHER_LOCATION_NAME || '',
			timeFormat: process.env.TIME_FORMAT,
			tempRouded: process.env.WEATHER_ROUNDED === 'true',
			showForecast: false,
			weather: {},
			updated: '',
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
			// get current weather
			this.$axios.get('/weather/realtime')
				.then((response) => {
					this.weather = response.data
					this.$emit('weather-more', response.data)
					if (process.env.AE_WEATHER_DETAILS === 'true') {
						this.$emit('weather-more-show')
					}
					if (process.env.AE_FORECAST === 'true') {
						this.$emit('show-forecast')
					}
					this.updated = moment(response.data.observation_time.value).format(this.timeFormat)
				})
				.catch((err) => {
					console.log(err)
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
