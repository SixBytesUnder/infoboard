import { shallowMount } from '@vue/test-utils'
import Datetime from '@/components/Datetime.vue'

describe('Datetime', () => {
	let wrapper

	beforeEach(() => {
		wrapper = shallowMount(Datetime, {
			// Create a shallow instance of the component
			data() {
				return {
					messages: ['Cat']
				}
			}
		})
	})

	it('is instantiated', () => {
		expect(wrapper.vm).toBeTruthy()
	})

	// it('has received ["Cat"] as the message property', () => {
	// 	expect(wrapper.vm.messages).toEqual(['Cat'])
	// })

	it('has the expected html structure', () => {
		const elmArray = wrapper.findAll('p')
		const elm = elmArray.at(0)
		// const elm = wrapper.find('p')
		expect(elm.classes()).toContain('display-1')
	})
})
