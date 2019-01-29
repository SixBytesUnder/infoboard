<template>
	<div class="col">
		<div>
			<p class="row time display-1 px-2 withBackground">
				{{ time }}
			</p>
		</div>
		<div class="row mt-2">
			<p class="h4 px-2 py-1 withBackground">
				{{ date }}
			</p>
		</div>
	</div>
</template>

<script>
import moment from 'moment'

export default {
	data: function() {
		return {
			time: moment().format(process.env.TIME_FORMAT),
			date: moment().format(process.env.DATE_FORMAT),
			moment: moment
		}
	},
	mounted() {
		this.interval = setInterval(this.updateTime, 1000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		updateTime () {
			this.time = moment().format(process.env.TIME_FORMAT)
			this.date = moment().format(process.env.DATE_FORMAT)
		}
	}
}
</script>

<style scoped>
@media (max-width: 575.98px) {
	.time {
		font-size: 4rem;
	}
}
</style>
