# alfred-portal [![Build Status](https://travis-ci.org/LordZardeck/alfred-portal.svg?branch=master)](https://travis-ci.org/LordZardeck/alfred-portal)

> Portal Search and Open


## Install

```
$ npm install --global alfred-portal
```

*Requires [Node.js](https://nodejs.org) 4+ and the Alfred [Powerpack](https://www.alfredapp.com/powerpack/).*

## Configuration

This workflow requires you to setup your portal API url and API key using Alfred variables. Optionally, you can also define a custom cache lifetime. Open the "portal" workflow in Alfred and click on the "[X]" at the top-right of the screen to configure the variables.

- portalApiUrl
- portalApiKey
- portalCacheLifetime

### Links

You can define links that can be searched within an associated project. Using `portal-options`, you can edit the config
file and specify custom links like so:

```json
{
	"links": {
		"<project-id>": {
			"<link-description>": "<link-url>"
		}
	}
}
```



## Usage

In Alfred, type `portal`, <kbd>Enter</kbd>, and your query.

### Tasks

You can search tasks by task id, task name, or assignee name. If you search by assignee name first, you can also search task names within that assignee

## License

MIT © [Sean Templeton](https://templeton.io)
