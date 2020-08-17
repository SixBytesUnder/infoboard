<template>
	<div class="row pt-2">
		<div
			v-if="enable"
			class="col-12 col-sm-6">
			<div class="row">
				<div class="item col mx-2">
					<div class="media p-2 withBackground">
						<img
							id="bus-icon"
							class="align-self-start"
							src="~/assets/images/bus.svg"
							alt="Bus"
							@click="toggleBuses">
						<div
							v-if="showBuses"
							class="media-body mx-2">
							<p
								v-for="(bus, busNumber) in buses"
								:key="busNumber">
								<span class="badge badge-light mr-1">
									{{ busNumber }}
								</span>
								<span
									v-for="(time, indexT) in bus"
									:key="indexT"
									class="align-self-middle">
									<span v-if="indexT+1 < bus.length">
										{{ time }}m,
									</span>
									<span v-else>
										{{ time }}m
									</span>
								</span>
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="row">
				<div class="item col m-2">
					<div
						v-if="!showTube"
						id="tube-icon"
						class="p-2 withBackground">
						<img
							class="bus-icon"
							src="~/assets/images/tube.svg"
							alt="Tube"
							@click="toggleTube">
					</div>
					<div
						v-if="showTube"
						:class="magicMirror ? 'mm' : ''"
						class="tube-data px-2 py-2 withBackground"
						@click="toggleTube">
						<div
							v-for="(line, idx) of tube"
							:key="idx"
							class="row">
							<div class="col">
								<span
									:class="line.id"
									class="badge w-100">
									{{ line.name }}
								</span>
							</div>
							<div
								class="col align-items-center"
								style="white-space: nowrap">
								{{ line.lineStatuses.statusSeverityDescription }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			v-if="weatherMoreInfo && weather"
			class="col-12 col-sm-6 pr-4 mb-2">
			<div class="ml-auto p-2 smaller withBackground">
				<div
					v-for="(name, slug) in fieldsMore"
					:key="slug"
					class="row px-2">
					<div
						v-if="weather && weather[slug]"
						class="col pl-2 pr-3 border-bottom border-right">
						{{ name }}
					</div>
					<div class="col px-2 border-bottom text-center">
						{{ weather[slug].value }} {{ weather[slug].units }}
					</div>
				</div>
			</div>
		</div>
		<Temphumid />
	</div>
</template>

<script>
import axios from 'axios'
import Temphumid from '~/components/Temphumid.vue'

export default {
	name: 'Weathermore',
	components: {
		Temphumid
	},
	props: {
		weatherMoreInfo: {
			type: Boolean,
			default() {
				return false
			}
		},
		weather: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			enable: process.env.TFL === 'true',
			appId: process.env.TFL_APP_ID,
			appKey: process.env.TFL_APP_KEY,
			busStops: process.env.TFL_BUS_STOPS.split(','),
			statusLines: process.env.TFL_STATUS,
			magicMirror: process.env.MAGIC_MIRROR === 'true',
			showBuses: process.env.AE_TFL === 'true',
			showTube: process.env.AE_TFL === 'true',
			// this.busesTemp is needed because updating this.buses directly causes display issues
			busesTemp: {},
			buses: {},
			tube: {},
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
			}
		}
	},
	mounted() {
		this.getTfLStatus()
		this.interval = setInterval(this.getTfLStatus, 60000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		toggleBuses() {
			this.showBuses = !this.showBuses
		},
		toggleTube() {
			this.showTube = !this.showTube
		},
		getTfLStatus() {
			// clear existing buses timetable object
			this.busesTemp = {}
			this.buses = {}
			if (this.busStops.length > 0) {
				this.getBus()
			}
			// tube line status
			this.getTube()
		},
		async getBus() {
			const busStop = this.busStops.shift()
			await axios.get(`https://api.tfl.gov.uk/StopPoint/${busStop}/Arrivals?app_id=${this.appId}&app_key=${this.appKey}`)
				.then((res) => {
					if (res.status === 200) {
						for (let i = 0; i < res.data.length; i++) {
							let timetable = ''

							if (typeof res.data[i].timeToStation === 'number') {
								timetable = Math.round(res.data[i].timeToStation / 60)
							} else if (res.data[i].timeToStation <= 0.2) {
								timetable = 'Due'
							} else {
								timetable = res.data[i].timeToStation
							}

							if (this.busesTemp[res.data[i].lineName] === undefined) {
								this.busesTemp[res.data[i].lineName] = []
							}
							// add only unique arrival times to array
							if (!this.busesTemp[res.data[i].lineName].includes(timetable)) {
								this.busesTemp[res.data[i].lineName].push(timetable)
							}
							this.busesTemp[res.data[i].lineName].sort((a, b) => a - b)
						}
					} else if (process.env.NODE_ENV === 'development') {
						console.log(res.message)
					}
				}).then(() => {
					if (this.busStops.length > 0) {
						this.getBus()
					} else {
						this.buses = this.busesTemp
						// reassign bus stops from configuration
						this.busStops = process.env.TFL_BUS_STOPS.split(',')
					}
				}).catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
		},
		async getTube() {
			await axios.get(`https://api.tfl.gov.uk/line/mode/${this.statusLines}/status?app_id=${this.appId}&app_key=${this.appKey}`)
				.then((res) => {
					if (res.status === 200) {
						for (let i = 0; i < res.data.length; i++) {
							this.tube[res.data[i].id] = {
								id: res.data[i].id,
								name: res.data[i].name
							}
							// iterate through statuses
							for (let j = 0; j < res.data[i].lineStatuses.length; j++) {
								const lineStatus = res.data[i].lineStatuses[j]
								this.tube[res.data[i].id].lineStatuses = {
									statusSeverity: lineStatus.statusSeverity,
									statusSeverityDescription: lineStatus.statusSeverityDescription
								}
							}
						}
					} else if (process.env.NODE_ENV === 'development') {
						console.log(res.message)
					}
				}).catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
		}
	}
}
</script>

<style scoped>
#bus-icon, #tube-icon img {
	min-width: 10%;
	width: 4rem;
}
.bakerloo {
	background-color: #AE6118;
	color: #FFFFFF;
}
.central {
	background-color: #E41F1F;
	color: #FFFFFF;
}
.circle {
	background-color: #F8D42D;
	color: #113892;
}
.district {
	background-color: #007229;
	color: #FFFFFF;
}
.dlr {
	background-color: #00BBB4;
	color: #FFFFFF;
}
.hammersmith-city {
	background-color: #E899A8;
	color: #113892;
}
.jubilee {
	background-color: #686E72;
	color: #FFFFFF;
}
.metropolitan {
	background-color: #893267;
	color: #FFFFFF;
}
.northern {
	background-color: #000000;
	color: #FFFFFF;
}
.overground {
	background-color: #F86;
	color: #FFFFFF;
}
.london-overground {
	background-color: #e86a10;
	color: #000;
}
.piccadilly {
	background-color: #0450A1;
	color: #FFFFFF;
}
.tfl-rail {
	background-color: #0019a8;
	color: #FFFFFF;
}
.tram {
	background-color: #6c0;
	color: #FFFFFF;
}
.victoria {
	background-color: #009FE0;
	color: #FFFFFF;
}
.waterloo-city {
	background-color: #70C3CE;
	color: #113892;
}

.mm .badge {
	background: none;
	color: #FFFFFF;
}

.smaller {
	font-size: 0.75rem;
}

@media (max-width: 575.98px) {
	.item {
		min-width: 90%;
	}
}
</style>
