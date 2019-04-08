<template>
	<div
		v-if="enableWeather === 'true'"
		class="col">
		<div class="row">
			<div
				v-if="weather.currently"
				class="col weather pr-0">
				<div class="media px-2 float-right withBackground">
					<img
						id="weather-icon"
						:src="weather.currently.icon ? '/images/'+weather.currently.icon+'.svg' : '/images/missing.svg'"
						:alt="weather.currently.summary"
						class="align-self-center mr-2"
						@click="toggleForecast">
					<div class="media-body my-2">
						<p>
							<img
								:alt="weather.timezone"
								src="/images/pin.svg"
								class="location-icon">
							{{ locationName == '' ? weather.timezone : locationName }}
						</p>
						<p class="display-4">
							{{ roundValue(weather.currently.temperature) }}&deg;{{ units }}
						</p>
						<p>{{ weather.currently.summary }}</p>
						<small>
							<a
								href="https://darksky.net/poweredby/"
								target="_blank">
								Powered by Dark Sky
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
import axios from 'axios'
import moment from 'moment'

export default {
	data: function () {
		return {
			enableWeather: process.env.WEATHER,
			locationName: process.env.WEATHER_LOCATION_NAME,
			units: process.env.WEATHER_UNITS === 'fahrenheit' ? 'F' : 'C',
			tempRouded: false,
			weather: {},
			updated: '',
			moment: moment
		}
	},
	mounted() {
		this.tempRouded = process.env.WEATHER_ROUNDED === 'true'
		this.getWeather()
		this.interval = setInterval(this.getWeather, 600000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		toggleForecast() {
			this.$store.commit('showForecast', !this.$store.state.showForecast)
		},
		getWeather() {
			// get current weather
			axios.get('/api/weather')
				.then((response) => {
					this.weather = response.data
					this.$store.commit('loadForecast', response.data.daily.data)
					this.updated = moment.unix(response.data.currently.time).format('HH:mm:ss')
				})
				.catch((err) => {
					if (this.env === 'development') console.log(err)
				})
		},
		roundValue(val) {
			if (this.tempRouded === true) {
				return Math.round(val)
			} else {
				return val
			}
		}
	}
}
</script>

<style scoped>
.weather {
	text-align: left;
}
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
