export const state = () => ({
	forecast: [],
	showForecast: false
})

export const mutations = {
	showForecast(state, payload) {
		state.showForecast = payload
	},
	loadForecast(state, payload) {
		state.forecast = payload
	}
}
