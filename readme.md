# Template for flat project


## package.json

Update the project name and description.


## Sublime Text project file

Add the following to the project's `.sublime-project` file in `folders`

```json
	"folder_exclude_patterns": [
		"node_modules",
		"dist",
		"fonts"
	]
```

## Fonts

1. Create a font set at [fontello](http://fontell.com)
1. copy the `icons.woff` file into `source/fonts/`
1. and copy the icon codes into `/source/styles/components/icons.less`
