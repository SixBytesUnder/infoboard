module.exports = {
	root: true,
	// parser: 'babel-eslint',
	parser: 'vue-eslint-parser',
	env: {
		browser: true,
		node: true
	},
	extends: [
		"eslint:recommended",
		// https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
		// consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
		"plugin:vue/recommended",
		// "plugin:prettier/recommended"
  ],
	// required to lint *.vue files
	plugins: [
		'html',
		'vue'
	],
	// add your custom rules here
	rules: {
		"indent": [2, "tab"],
		"no-tabs": 0,
		'no-console': 'off'
	},
	globals: {}
}
