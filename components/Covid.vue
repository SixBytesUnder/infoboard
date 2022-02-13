<template>
	<div
		v-if="enable"
		class="row">
		<div class="col">
			<div class="row justify-content-end">
				<div class="d-flex flex-wrap p-2 mb-2 withBackground">
					<div>
						<span @click="toggleData">COVID-19 cases</span>
						<small
							v-if="showData && showToday"
							@click="toggleDay">
							| show previous
						</small>
						<small
							v-if="showData && !showToday"
							@click="toggleDay">
							| show latest
						</small>
					</div>
					<table
						v-if="showData"
						class="table table-sm table-bordered table-dark">
						<thead>
							<tr>
								<th scope="col">
									Date
								</th>
								<th scope="col">
									Country
								</th>
								<th scope="col">
									Total Cases
								</th>
								<th scope="col">
									New Cases
								</th>
								<th scope="col">
									Total Deaths
								</th>
								<th scope="col">
									New Deaths
								</th>
							</tr>
						</thead>
						<tbody v-if="showToday">
							<tr
								v-for="(country, index) in dataSet.today"
								:key="index">
								<td>{{ country.date }}</td>
								<td>{{ country.country_name }}</td>
								<td>{{ Intl.NumberFormat().format(country.total_cases) }}</td>
								<td>{{ Intl.NumberFormat().format(country.new_cases) }}</td>
								<td>{{ Intl.NumberFormat().format(country.total_deaths) }}</td>
								<td>{{ Intl.NumberFormat().format(country.new_deaths) }}</td>
							</tr>
						</tbody>
						<tbody v-if="!showToday">
							<tr
								v-for="(country, index) in dataSet.yesterday"
								:key="index">
								<td>{{ country.date }}</td>
								<td>{{ country.country_name }}</td>
								<td>{{ Intl.NumberFormat().format(country.total_cases) }}</td>
								<td>{{ Intl.NumberFormat().format(country.new_cases) }}</td>
								<td>{{ Intl.NumberFormat().format(country.total_deaths) }}</td>
								<td>{{ Intl.NumberFormat().format(country.new_deaths) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import dayjs from 'dayjs'

export default {
	name: 'CovidWidget',
	data() {
		return {
			enable: process.env.C19_ENABLE === 'true',
			showData: true,
			showToday: true,
			timer: process.env.C19_TIMER,
			countries: process.env.C19_COUNTRY.split(','),
			dateFormat: process.env.C19_DATE_FORMAT,
			dataSet: [],
			errors: []
		}
	},
	mounted() {
		if (this.enable) {
			this.getData()
			this.interval = setInterval(this.getData, this.timer * 1000)
		}
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		toggleData() {
			this.showData = !this.showData
		},
		toggleDay() {
			this.showToday = !this.showToday
		},
		getData() {
			this.$axios.get('https://covid.ourworldindata.org/data/owid-covid-data.json')
				.then((response) => {
					this.dataSet = {
						today: [],
						yesterday: []
					}
					// get last two days for each country
					if (this.countries.length > 0) {
						this.countries.forEach((countryCode) => {
							const country = response.data[countryCode]
							const today = country.data.slice(-1)
							this.dataSet.today.push({
								country_name: country.location,
								date: dayjs(today[0].date).format(this.dateFormat),
								total_cases: today[0].total_cases,
								new_cases: today[0].new_cases,
								total_deaths: today[0].total_deaths,
								new_deaths: today[0].new_deaths
							})
							const yesterday = country.data.slice(-2, -1)
							this.dataSet.yesterday.push({
								country_name: country.location,
								date: dayjs(yesterday[0].date).format(this.dateFormat),
								total_cases: yesterday[0].total_cases,
								new_cases: yesterday[0].new_cases,
								total_deaths: yesterday[0].total_deaths,
								new_deaths: yesterday[0].new_deaths
							})
						})
					} else {
						console.log('No countries specified to pull data for.')
					}
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
		}
	}
}
</script>

<style scoped>
.table {
	color: #fff;
	font-size: 0.7rem;
}
.table-dark {
	background-color: #343a40;
	background-color: rgba(52, 58, 64, 0.7);
}
</style>
