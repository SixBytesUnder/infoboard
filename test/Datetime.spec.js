import { shallowMount } from '@vue/test-utils'
import Datetime from '@/components/Datetime.vue'

describe('Datetime', () => {
	let wrapper

	beforeEach(() => {
		wrapper = shallowMount(Datetime, {
			data() {
				return {
					time: null,
					date: null
				}
			}
		})
	})

	it('is instantiated', () => {
		expect(wrapper.vm).toBeTruthy()
	})

	it('has the expected html structure', () => {
		const elmArray = wrapper.findAll('p')
		const elm = elmArray.at(0)
		expect(elm.classes()).toContain('display-1')
	})

	it('sets time and date', () => {
		wrapper.vm.updateTime()
		expect(wrapper.vm.time).toContain(new Date().getFullYear())
	})
})
