'use strict';
const alfy = require('alfy'),
	xml2js = new require('xml2js').Parser(),
	Fuze = require('fuse.js');

if (!process.env.portalApiUrl || !process.env.portalApiKey) {
	alfy.error('You must specify the API url and API key in the workflow variables');
	return;
}

alfy.fetch(process.env.portalApiUrl, {
	maxAge: process.env.portalCacheLifetime || 1000 * 60 * 60 * 24,
	query: {
		auth_api_token: process.env.portalApiKey,
		path_info: 'projects/' + process.env.projectId + '/discussions'
	},
	transform: response => {
		return new Promise((resolve, reject) => {
			xml2js.parseString(response, (error, result) => {
				if (error) {
					return reject(error);
				}

				resolve(result.discussions.discussion);
			})
		});
	},
	json: false,
}).then(response => {
	const data = response.map(discussion => {
		return {
			title: discussion.name.join(' '),
			arg: discussion.permalink.join('')
		};
	});
	const fuzeSearch = new Fuze(data, {
		shouldSort: true,
		threshold: 0.49,
		location: 0,
		distance: 100,
		maxPatternLength: 32,
		minMatchCharLength: 1,
		keys: ['title']
	});

	let searchResults = fuzeSearch.search(alfy.input);

	if (searchResults.length === 0) {
		searchResults = data;
	}

	alfy.output(searchResults);
}).catch(response => {
	if (response.statusCode === 403) {
		alfy.error('Your API key is invalid. Please check your key and try again.');
		return;
	}

	alfy.error(response);
});
