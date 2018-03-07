'use strict';
const alfy = require('alfy'),
	xml2js = new require('xml2js').Parser(),
	Fuze = require('fuse.js'),
	Person = require('./people');

if (!process.env.portalApiUrl || !process.env.portalApiKey) {
	alfy.error('You must specify the API url and API key in the workflow variables');
	return;
}

alfy.fetch(process.env.portalApiUrl, {
	maxAge: process.env.portalCacheLifetime || 1000 * 60 * 60 * 24,
	query: {
		auth_api_token: process.env.portalApiKey,
		path_info: 'projects/' + process.env.projectId + '/tasks'
	},
	transform: response => {
		return new Promise((resolve, reject) => {
			xml2js.parseString(response, (error, result) => {
				if (error) {
					return reject(error);
				}

				resolve(result.tasks.task);
			})
		});
	},
	json: false,
}).then(response => {
	const data = response.map(task => {
		return {
			title: task.name.join(' '),
			taskId: task.task_id[0],
			assigneeId: task.assignee_id[0],
			arg: task.permalink.join('')
		};
	});

	let searchResults = data.filter(task => task.taskId.toString() === alfy.input);

	searchResults.forEach(result => {
		result.subtitle = `Open Task Number ${result.taskId}`;
	});

	(searchResults.length === 0 ? Person.getUserIds(alfy.input.indexOf(' ') > 0 ? alfy.input.substr(0, alfy.input.indexOf(' ')) : alfy.input) : Promise.resolve([])).then(people => {
		const peopleObject = people.reduce((previousValue, currentValue) => {
			previousValue[currentValue.id] = currentValue.name;
			return previousValue;
		}, {});
		const peopleIds = Object.keys(peopleObject);

		if (searchResults.length === 0) {
			if (people.length > 0) {
				searchResults = data.filter(task => peopleIds.indexOf(task.assigneeId) >= 0);

				searchResults.forEach(result => {
					result.subtitle = `Asignee ${peopleObject[result.assigneeId]}`.trim();
				});
			}

			if (people.length === 0 || alfy.input.substr(alfy.input.indexOf(' ')).trim().length > 0) {
				const fuzeSearch = new Fuze(searchResults, {
					shouldSort: true,
					threshold: 0.49,
					location: 0,
					distance: 100,
					maxPatternLength: 32,
					minMatchCharLength: 1,
					keys: ['title']
				});

				searchResults = fuzeSearch.search(people.length > 0 ? alfy.input.substr(alfy.input.indexOf(' ')).trim() : alfy.input);
			}
		}

		if (searchResults.length === 0) {
			searchResults = data;
		}

		alfy.output(searchResults);
	});

}).catch(response => {
	if (response.statusCode === 403) {
		alfy.error('Your API key is invalid. Please check your key and try again.');
		return;
	}

	alfy.error(response);
});
