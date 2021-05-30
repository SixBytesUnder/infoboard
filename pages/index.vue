<template>
	<div class="container-fluid">
		<Background
			v-if="enableWeather === true"
			:weather="weather" />
		<div class="row p-2 position-relative">
			<Datetime />
			<Weather
				v-if="enableWeather"
				@show-forecast="onShowForecast"
				@weather-more="onWeatherMore"
				@weather-more-show="onWeatherMoreShow" />
		</div>
		<Forecast
			:forecast-data="days"
			:show-forecast="showForecast" />

		<div class="row p-2 position-relative">
			<div class="col-12 col-sm-6 g-0">
				<Tfl />
				<Calendar />
			</div>
			<div class="col-12 col-sm-6">
				<Weathermore
					:weather-more-info="weatherMoreInfo"
					:weather="weather" />
				<Dht />
				<Sds />
				<Covid />
			</div>
		</div>
	</div>
</template>

<script>
import moment from 'moment'
import Background from '~/components/Background.vue'
import Datetime from '~/components/Datetime.vue'

export default {
	components: {
		Background,
		Datetime,
		Weather: () => import(/* webpackChunkName: "Weather" */ '~/components/Weather.vue'),
		Weathermore: () => import(/* webpackChunkName: "Weathermore" */ '~/components/Weathermore.vue'),
		Forecast: () => import(/* webpackChunkName: "Forecast" */ '~/components/Forecast.vue'),
		Calendar: () => import(/* webpackChunkName: "Calendar" */ '~/components/Calendar.vue'),
		Tfl: () => import(/* webpackChunkName: "Tfl" */ '~/components/Tfl.vue'),
		Dht: () => import(/* webpackChunkName: "Dht" */ '~/components/Dht.vue'),
		Sds: () => import(/* webpackChunkName: "Sds" */ '~/components/Sds.vue'),
		Covid: () => import(/* webpackChunkName: "Covid" */ '~/components/Covid.vue')
	},
	data() {
		return {
			enableWeather: process.env.WEATHER === 'true',
			magicMirror: process.env.MAGIC_MIRROR === 'true',
			weather: [],
			days: {},
			showForecast: false,
			weatherMoreInfo: false,
			moment
		}
	},
	head() {
		return {
			bodyAttrs: {
				class: this.magicMirror ? 'mm' : ''
			}
		}
	},
	methods: {
		onShowForecast(value) {
			this.showForecast = !this.showForecast
		},
		onWeatherMoreShow(value) {
			this.weatherMoreInfo = !this.weatherMoreInfo
		},
		onWeatherMore(value) {
			// needed for data behind the "more" button
			this.weather = value
			// clean foracast days object
			this.days = {}
			// transform raw weather data to clean daily forecast
			value[1].intervals.forEach((day) => {
				const date = moment(day.startTime).format('dddd')
				if (date in this.days) {
					this.days[date].temperature.push(day.values.temperature)
					this.days[date].weatherCode = day.values.weatherCode
				} else {
					this.days[date] = {
						date,
						temperature: [day.values.temperature],
						weatherCode: day.values.weatherCode
					}
				}
			})
		}
	}
}
</script>

<style>
html, body {
	background-color: #292929;
	color: #fff;
	font-family: 'Cousine', monospace;
	font-size: 18px;
	height: 100vh;
	-webkit-user-select: none; /* Safari */
	-moz-user-select: none; /* Firefox */
	-ms-user-select: none; /* IE10+/Edge */
	user-select: none; /* Standard */
}

/* .bgrImage {
	background-image: url("/api/background/2007-05-11_14%20-%20gosia%20i%20kasia%20w%20londynie%5C100_1224.JPG");
	image-orientation: from-image;
	height: 100vh;
	background-attachment: fixed;
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;

}
 */
.withBackground {
	background-color: #333333;
	background-color: rgba(41, 41, 41, 0.3);
	border-radius: 0.3rem;
	width: fit-content;
}

/* Styles for Magic Mirror mode - highest contrast */
.mm .withBackground {
	background: none;
}

@media (max-width: 575.98px) {
	html, body {
		font-size: 0.9rem;
	}
}
@media (max-width: 320px) {
	html, body {
		font-size: 0.8rem;
	}
}
</style>
