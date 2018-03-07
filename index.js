'use strict';
const alfy = require('alfy'),
	xml2js = new require('xml2js').Parser(),
	Fuze = require('fuse.js');

if (!process.env.portalApiUrl || !process.env.portalApiKey) {
	alfy.error('You must specify the API url and API key in the workflow variables');
	return;
}

const inputTaskMatches = alfy.input.match(/\s[a-zA-Z0-9]+$/);
const projectInput = inputTaskMatches !== null ? alfy.input.slice(0, inputTaskMatches.index) : alfy.input;
const taskNumber = inputTaskMatches !== null ? inputTaskMatches[0].trim() : null;
const workflowLinks = alfy.config.get('links') || {};

alfy.fetch(process.env.portalApiUrl, {
	maxAge: process.env.portalCacheLifetime || 1000 * 60 * 60 * 24,
	query: {
		auth_api_token: process.env.portalApiKey,
		path_info: 'projects'
	},
	transform: response => {
		return new Promise((resolve, reject) => {
			xml2js.parseString(response, (error, result) => {
				if (error) {
					return reject(error);
				}

				resolve(result.projects.project);
			})
		});
	},
	json: false,
}).then(response => {
	const data = response.map(project => {
		const projectUrl = project.permalink.join('');
		const links = workflowLinks[project.id];

		let subtitle = '';
		let argUrl = '';

		if (taskNumber != null && Number.isInteger(parseInt(taskNumber, 10))) {
			subtitle = `Open Task Number ${taskNumber}`;
			argUrl = projectUrl + '/tasks/' + taskNumber;
		}

		if (taskNumber != null && subtitle === '' && links !== void(0)) {
			const fuzeSearch = new Fuze(
				Object.keys(links).map(description => {
					return {
						description,
						url: links[description]
					};
				}), {
					shouldSort: true,
					threshold: 0.49,
					location: 0,
					distance: 100,
					maxPatternLength: 32,
					minMatchCharLength: 1,
					keys: ['description']
				});

			const linksResults = fuzeSearch.search(taskNumber);

			if (linksResults.length > 0) {
				subtitle = `Open Link ${linksResults[0].description}`;
				argUrl = linksResults[0].url;
			}
		}

		return {
			title: project.name.join(' '),
			subtitle,
			projectId: project.id,
			links,
			arg: JSON.stringify({
				alfredworkflow: {
					arg: argUrl,
					variables: {
						projectId: project.id,
						projectUrl
					}
				}
			})
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

	let searchResults = data.filter(project => project.projectId.toString() === projectInput);

	if (searchResults.length === 0) {
		searchResults = data.filter(project => project.projectId.toString() === projectInput);
	}

	if (searchResults.length === 0) {
		searchResults = fuzeSearch.search(projectInput);
	}

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
