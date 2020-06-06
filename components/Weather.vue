<template>
	<div
		v-if="enableWeather === 'true'"
		class="col">
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
							{{ weather.temp.value }}&deg;{{ weather.temp.units }}
						</p>
						<p class="smaller">
							Feels like
							{{ weather.feels_like.value }}&deg;{{ weather.feels_like.units }}
						</p>
						<p class="d-flex justify-content-between align-items-center">
							{{ weather.weather_code.value }}
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
import axios from 'axios'
import moment from 'moment'

export default {
	data() {
		return {
			enableWeather: process.env.WEATHER,
			locationName: process.env.WEATHER_LOCATION_NAME,
			timeFormat: process.env.TIME_FORMAT,
			fieldsMore: {
				humidity: 'Humidity',
				wind_speed: 'Wind speed',
				wind_gust: 'Wind gust speed',
				baro_pressure: 'Barometric pressure',
				surface_shortwave_radiation: 'Solar radiation reaching the surface',
				moon_phase: 'Moon phase',
				pm25: 'Particulate Matter < 2.5 μm',
				pm10: 'Particulate Matter < 10 μm',
				o3: 'Ozone',
				no2: 'Nitrogen Dioxide',
				co: 'Carbon Monoxide',
				so2: 'Sulfur Dioxide',
				epa_health_concern: 'Air quality index per US EPA standard',
				pollen_tree: 'ClimaCell pollen index for trees',
				pollen_weed: 'ClimaCell pollen index for weeds',
				pollen_grass: 'ClimaCell pollen index for grass'
			},
			moreInfo: false,
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
			this.$store.commit('showForecast', !this.$store.state.showForecast)
		},
		toggleMoreInfo() {
			this.$emit('weather-more-show')
		},
		getWeather() {
			// get current weather
			const params = {
				lat: process.env.WEATHER_LAT,
				lon: process.env.WEATHER_LON,
				unit_system: process.env.WEATHER_UNITS === 'us' ? 'us' : 'si',
				fields: process.env.WEATHER_FIELDS,
				apikey: process.env.WEATHER_API_KEY
			}
			axios.get('https://api.climacell.co/v3/weather/realtime', {
				params
			})
				.then((response) => {
					this.weather = response.data
					this.$emit('weather-more', response.data)
					this.updated = moment(response.data.observation_time.value).format(this.timeFormat)
				})
				.catch((err) => {
					console.log(err)
				})
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
