<template>
	<div
		v-if="$store.state.forecast && $store.state.showForecast && enableWeather === 'true'"
		class="row mx-0 py-2">
		<div
			v-for="(day, index) of $store.state.forecast"
			:key="index"
			class="forecastWrapper col withBackground mx-2 mb-2">
			<div class="forecast h-100 m-auto">
				<div class="col">
					{{ moment.unix(day.time).format('dddd') }}
				</div>
				<div class="col forecastIcon">
					<img
						:src="loadImage('images/'+day.icon+'.svg')"
						:alt="day.summary">
				</div>
				<div class="col">
					{{ roundValue(day.temperatureHigh) }}&deg;{{ units }}
				</div>
				<div class="col">
					{{ roundValue(day.temperatureLow) }}&deg;{{ units }}
				</div>
				<div class="col small px-0">
					{{ day.summary }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'

export default {
	data() {
		return {
			enableWeather: process.env.WEATHER,
			apiKey: process.env.WEATHER_API_KEY,
			lat: process.env.WEATHER_LAT,
			lon: process.env.WEATHER_LON,
			locationName: process.env.WEATHER_LOCATION_NAME,
			units: process.env.WEATHER_UNITS === 'us' ? 'us' : 'si',
			tempRouded: process.env.WEATHER_ROUNDED === 'true',
			forecast: {},
			moment
		}
	},
	mounted() {
		this.getForecast()
		this.interval = setInterval(this.getForecast, 600000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		loadImage(path) {
			return require(`~/assets/${path}`)
		},
		getForecast() {
			const params = {
				lat: this.lat,
				lon: this.lon,
				unit_system: this.units,
				fields: 'temp,feels_like,humidity,wind_speed,wind_direction,baro_pressure,precipitation,precipitation_probability,weather_code',
				apikey: this.apiKey
			}
			axios.get('https://api.climacell.co/v3/weather/forecast/daily', {
				params
			})
				.then(function(response) {
					console.log(response.data)
				})
				.catch(function(error) {
					console.log(error)
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
.forecast {
	text-align: center;
}
.forecastIcon img {
	width: 50%;
}
@media (max-width: 575.98px) {
	.forecastWrapper {
		min-width: 45%;
	}
}
</style>
