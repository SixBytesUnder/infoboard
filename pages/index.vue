<template>
	<div class="container-fluid">
		<BackgroundWidget
			v-if="enableWeather === true"
			:weather="weather" />
		<div class="row p-2 position-relative">
			<DateTime />
			<WeatherWidget
				v-if="enableWeather"
				@show-forecast="onShowForecast"
				@weather-more="onWeatherMore"
				@weather-more-show="onWeatherMoreShow" />
		</div>
		<ForecastWidget
			:forecast-data="days"
			:show-forecast="showForecast" />

		<div class="row p-2 position-relative">
			<div class="col-12 col-sm-6 g-0">
				<TflWidget />
				<CalendarWidget />
			</div>
			<div class="col-12 col-sm-6">
				<WeatherMore
					:weather-more-info="weatherMoreInfo"
					:weather="weather" />
				<SenseHatWidget />
				<DhtWidget />
				<SdsWidget />
				<CovidWidget />
			</div>
		</div>
	</div>
</template>

<script>
import dayjs from 'dayjs'
import BackgroundWidget from '~/components/Background.vue'
import DateTime from '~/components/Datetime.vue'

export default {
	components: {
		BackgroundWidget,
		DateTime,
		WeatherWidget: () => import(/* webpackChunkName: "WeatherWidget" */ '~/components/Weather.vue'),
		WeatherMore: () => import(/* webpackChunkName: "WeatherMore" */ '~/components/Weathermore.vue'),
		ForecastWidget: () => import(/* webpackChunkName: "ForecastWidget" */ '~/components/Forecast.vue'),
		CalendarWidget: () => import(/* webpackChunkName: "CalendarWidget" */ '~/components/Calendar.vue'),
		TflWidget: () => import(/* webpackChunkName: "TflWidget" */ '~/components/Tfl.vue'),
		SenseHatWidget: () => import(/* webpackChunkName: "SenseHat" */ '~/components/Sensehat.vue'),
		DhtWidget: () => import(/* webpackChunkName: "DhtWidget" */ '~/components/Dht.vue'),
		SdsWidget: () => import(/* webpackChunkName: "SdsWidget" */ '~/components/Sds.vue'),
		CovidWidget: () => import(/* webpackChunkName: "CovidWidget" */ '~/components/Covid.vue')
	},
	data() {
		return {
			enableWeather: process.env.WEATHER === 'true',
			magicMirror: process.env.MAGIC_MIRROR === 'true',
			weather: [],
			days: {},
			showForecast: false,
			weatherMoreInfo: false,
			dayjs
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
			this.weather = value.find(element => element.timestep === 'current').intervals[0].values
			// clean foracast days object
			this.days = {}
			// transform raw weather data to clean daily forecast
			const forecast = value.find(element => element.timestep === '1d')
			forecast.intervals.forEach((day) => {
				const date = dayjs(day.startTime).format('dddd')
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
