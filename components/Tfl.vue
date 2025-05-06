<template>
	<div v-if="enable">
		<div class="row">
			<div class="item col">
				<div class="media mr-2 p-2 withBackground">
					<img
						id="bus-icon"
						class="align-self-start"
						src="~/assets/images/bus.svg"
						alt="Bus"
						@click="toggleBuses">
					<div
						v-if="showBuses"
						class="media-body mx-2 mt-2">
						<div
							v-for="(timetable, name) in buses"
							:key="name">
							<p>{{ name }}</p>
							<p
								v-for="(bus, busNumber) in timetable"
								:key="busNumber">
								<span class="badge bg-light text-dark mr-1">
									{{ busNumber }}
								</span>
								<span
									v-for="(time, indexT) in bus"
									:key="indexT"
									class="align-self-middle">
									<span v-if="time === 'Due'">
										{{ time }},
									</span>
									<span v-else-if="indexT+1 < bus.length">
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
		</div>

		<div class="row">
			<div class="item col mr-2 my-2">
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
					class="tube-data p-2 withBackground"
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
</template>

<script>
export default {
	name: 'TfLWidget',
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
			buses: {},
			tube: {}
		}
	},
	mounted() {
		this.getTflData()
		this.interval = setInterval(this.getTflData, 60000)
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
		getTflData() {
			this.$axios.get('/tfl')
				.then((response) => {
					this.buses = response.data.buses
					this.tube = response.data.tube
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.error(err) }
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
	background-color: #aa571e;
	color: #FFFFFF;
}
.central {
	background-color: #d8121b;
	color: #FFFFFF;
}
.circle {
	background-color: #ffd000;
	color: #113892;
}
.district {
	background-color: #00702f;
	color: #FFFFFF;
}
.dlr {
	background-color: #00a3a0;
	color: #FFFFFF;
}
.elizabeth {
	background-color: #704491;
	color: #FFFFFF;
}
.hammersmith-city {
	background-color: #eda1b0;
	color: #113892;
}
.jubilee {
	background-color: #81888b;
	color: #FFFFFF;
}
.metropolitan {
	background-color: #8a134d;
	color: #FFFFFF;
}
.northern {
	background-color: #000000;
	color: #FFFFFF;
}
.piccadilly {
	background-color: #112d81;
	color: #FFFFFF;
}
.tram {
	background-color: #7db41d;
	color: #FFFFFF;
}
.victoria {
	background-color: #009cd6;
	color: #FFFFFF;
}
.waterloo-city {
	background-color: #7ec4ab;
	color: #113892;
}
/* Overgound */
.liberty {
	background-color: #656664;
	color: #FFFFFF;
}
.lioness {
	background-color: #f7a800;
	color: #FFFFFF;
}
.mildmay {
	background-color: #0076ac;
	color: #FFFFFF;
}
.suffragette {
	background-color: #65b361;
	color: #FFFFFF;
}
.weaver {
	background-color: #883960;
	color: #FFFFFF;
}
.windrush {
	background-color: #e20026;
	color: #FFFFFF;
}

.mm .badge {
	background: none;
	color: #FFFFFF;
}

@media (max-width: 575.98px) {
	.item {
		min-width: 90%;
	}
}
</style>
