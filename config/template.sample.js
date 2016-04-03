

module.exports.template = {
	wordpress: {
		title: 'My cool Blog',
		site_repo: 'ssh://git@git.schmidigital.de:7999/vaas/vaas.git',
		plugins: [
			'connector-woo-odoo',
			'wp-rest': 'ssh://git@git.schmidigital.de:7999/wordpress-plugins/wp-rest.git'
		],
		theme: 'foundation'
	}
}