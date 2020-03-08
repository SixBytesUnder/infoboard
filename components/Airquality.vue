<template>
	<div
		v-if="enable === 'true'"
		class="col">
		<div class="row">
			<div class="col mx-2">
				<div class="row px-3 pb-2 justify-content-end">
					<div class="d-flex flex-wrap p-2 withBackground">
						<img
							id="icon"
							src="~/assets/images/smile1.svg"
							class="mr-2">
						<p>{{ quality }}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'

export default {
	data() {
		return {
			env: process.env.NODE_ENV,
			enable: process.env.SDS011,
			showDetails: false,
			quality: '~',
			errors: []
		}
	},
	mounted() {
		this.getData()
		this.interval = setInterval(this.getData, process.env.SDS_FREQUENCY * 1000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		toggleDetails() {
			this.showDetails = !this.showDetails
		},
		getData() {
			axios.get('/api/sds')
				.then((response) => {
					this.quality = response.data
				})
				.catch((err) => {
					if (this.env === 'development') { console.log(err) }
				})
		}
	}
}
</script>

<style scoped>
#icon {
	width: 1rem;
}
</style>
