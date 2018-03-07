'use strict';
const alfy = require('alfy'),
	Fuze = require('fuse.js');

const links = alfy.config.get('links'),
	projectId = process.env.projectId;

if (links === void(0) || links[projectId] === void(0)) {
	alfy.error('No links specified in config. Please edit the configuration in the workflow');
	return;
}

const data = Object.keys(links[projectId]).map(linkDescription => {
	return {
		title: linkDescription,
		arg: links[projectId][linkDescription]
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
