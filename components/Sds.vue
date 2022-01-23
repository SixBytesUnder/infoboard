<template>
	<div
		v-if="enable"
		class="row">
		<div class="col">
			<div class="row pb-2 justify-content-end">
				<div class="row p-2 g-0 withBackground">
					<div class="col text-center">
						<img
							id="sds-icon"
							:src="loadImage(quality)">
					</div>
					<div class="col">
						<span>PM2.5: {{ pm25 }}</span>
						<span>PM10: {{ pm10 }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'SdsWidget',
	data() {
		return {
			env: process.env.NODE_ENV,
			enable: process.env.SDS011 === 'true',
			showDetails: false,
			pm25: 0,
			pm10: 0,
			quality: 'sds_smile',
			errors: []
		}
	},
	mounted() {
		if (this.enable) {
			this.getData()
			this.interval = setInterval(this.getData, process.env.SDS_FREQUENCY * 1000)
		}
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		loadImage(name) {
			return require(`~/assets/images/${name}.svg`)
		},
		toggleDetails() {
			this.showDetails = !this.showDetails
		},
		getData() {
			let quality25 = 0
			let quality10 = 0
			const icon = {
				1: 'sds_smile',
				2: 'sds_neutral',
				3: 'sds_sad',
				4: 'sds_dead'
			}
			this.$axios.get('/sds')
				.then((response) => {
					this.pm25 = response.data.pm25
					this.pm10 = response.data.pm10
					// Determine quality of PM2.5 particles
					if (this.pm25 <= 35) {
						quality25 = 1
					} else if (this.pm25 >= 35 && this.pm25 <= 53) {
						quality25 = 2
					} else if (this.pm25 > 53 && this.pm25 <= 70) {
						quality25 = 3
					} else if (this.pm25 > 70) {
						quality25 = 4
					}
					// Determine quality of PM10 particles
					if (this.pm10 <= 50) {
						quality10 = 1
					} else if (this.pm10 > 51 && this.pm10 <= 75) {
						quality10 = 2
					} else if (this.pm10 > 75 && this.pm10 <= 100) {
						quality10 = 3
					} else if (this.pm10 > 100) {
						quality10 = 4
					}
					this.quality = icon[Math.max(quality25, quality10)]
				})
				.catch((err) => {
					if (this.env === 'development') { console.log(err) }
				})
		}
	}
}
</script>

<style scoped>
#sds-icon {
	width: 2rem;
}
.withBackground {
	font-size: .8rem;
}
</style>
