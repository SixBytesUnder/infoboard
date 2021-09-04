module.exports = {
	root: true,
	env: {
		browser: true,
		node: true
	},
	parserOptions: {
		parser: 'babel-eslint'
	},
	extends: [
		'@nuxtjs',
		'plugin:nuxt/recommended'
	],
	plugins: [
	],
	// add your custom rules here
	rules: {
		'nuxt/no-cjs-in-config': 'off',
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'vue/html-indent': ['error', 'tab'],
		'vue/html-closing-bracket-newline': 'off',
		'vue/script-setup-uses-vars': 'off',
		indent: [2, 'tab',
			{ ignoredNodes: ['TemplateLiteral'] }],
		'template-curly-spacing': 'off',
		'no-tabs': 'off',
		'space-before-function-paren': ['error', 'never']
	}
}
