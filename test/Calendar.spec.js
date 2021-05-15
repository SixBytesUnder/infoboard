import { mount } from '@vue/test-utils'
import Calendar from '@/components/Calendar.vue'

describe('Calendar', () => {
	let wrapper

	beforeEach(() => {
		wrapper = mount(Calendar, {
			data() {
				return {
					enable: true
				}
			}
		})
	})

	it('is instantiated', () => {
		expect(wrapper.vm).toBeTruthy()
	})

	it('has the expected html structure', () => {
		const elm = wrapper.find('img')
		expect(elm.classes()).toContain('calendar-icon')
	})

	it('gets Calendar event list', () => {
		wrapper.vm.getEvents()
		console.log(wrapper.vm.eventsList)
		expect(wrapper.vm.eventsList).toBeTruthy()
	})
})
