'use strict';
const alfy = require('alfy'),
	xml2js = new require('xml2js').Parser(),
	Fuze = require('fuse.js');

module.exports = {
	getUserIds: function getUserIds(name) {
		if (!process.env.portalApiUrl || !process.env.portalApiKey) {
			alfy.error('You must specify the API url and API key in the workflow variables');
			return;
		}

		return alfy.fetch(process.env.portalApiUrl, {
			maxAge: process.env.portalCacheLifetime || 1000 * 60 * 60 * 24,
			query: {
				auth_api_token: process.env.portalApiKey,
				path_info: 'projects/' + process.env.projectId + '/people'
			},
			transform: response => {
				return new Promise((resolve, reject) => {
					xml2js.parseString(response, (error, result) => {
						if (error) {
							return reject(error);
						}

						resolve(result.project_users.project_user);
					})
				});
			},
			json: false,
		}).then(response => {
			return response.map(person => {
				return {
					name: person.user[0].name.join(' '),
					id: person.user[0].id[0]
				};
			}).filter(person => name.trim() !== '' && person.name.toLowerCase().indexOf(name.toLowerCase()) >= 0);

		}).catch(response => {
			if (response.statusCode === 403) {
				alfy.error('Your API key is invalid. Please check your key and try again.');
				return;
			}

			alfy.error(response);
		});
	}
};
