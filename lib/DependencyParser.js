var fs = require('fs');
var DependencyManager = require('./DependencyManager');

function readFile(aFileName) {
	try {
		return fs.readFileSync(aFileName, 'utf8');
	} catch(e) {
		return null;
	}
}

var DIRECTIVE_PARSERS = (function() {
	function error(aMessage) {
		return {
			type: 'error',
			message: aMessage
		};
	}

	return {
		import: function(aSource) {
			var match = aSource.match(/^import ((?:\w+\/)*(\w+))$/);

			if (!match) {
				return error('Invalid import syntax: ' + aSource);
			}

			return {
				type: 'import',
				name: match[2],
				path: match[1] + '.js'
			};
		},

		resource: function(aSource) {
			var match = aSource.match(/^resource (\w+): ([\w.]+(?:\/[\w.]+)*)$/);

			if (!match) {
				return error('Invalid resource syntax: ' + aSource);
			}

			return {
				type: 'resource',
				name: match[1],
				path: match[2]
			};
		}
	};
})();

function isTruthy(aObject) {
	return !!aObject;
}

var DIRECTIVES_PREFIX_RX = /^(import|resource|globals?|jshint|exported) /;
function isDirective(aString) {
	return DIRECTIVES_PREFIX_RX.test(aString);
}

function parseSource(aSource) {
	var directives = [];

	var comments = '';
	var rx = /\s*(?:(?:\/\/(.*))|(?:\/\*([^]*?)\*\/))\r?\n?/g;
	var fullRx = new RegExp('^(?:' + rx.source + '\\s*)*');
	var dirSource = (fullRx.exec(aSource) || [])[0] || '';
	var source = aSource.substr(dirSource.length);

	while (true) {
		var prevIndex = rx.lastIndex;
		var m = rx.exec(dirSource);

		if (!m) {
			break;
		}

		var val = (m[1] || m[2] || '').trim();

		var subVals = val
			.split(/(?:\r\n|\n|\r)\s*/g)
			.filter(isTruthy);

		if (!subVals.length || !isDirective(subVals[0])) {
			var comment = dirSource.substring(prevIndex, rx.lastIndex);

			var preview = comment.trim().match(/.*/)[0];
			if (!/\w+/.test(preview)) {
				preview = comment.replace(/\r\n|\r|\n/g, ' ').substr(0, 31);
			}
			console.info('Comment is not a directive: ' + preview);

			comments += comment;
			continue;
		}

		// jshint loopfunc:true
		subVals.forEach(function(aValue) {
			if (!isDirective(aValue)) {
				console.info('Non derective found among directives: ' + aValue);
				return;
			}

			directives.push(aValue);
		});
		// jshint loopfunc:false
	}

	return {
		directives: directives,
		source: comments + source
	};
}

function parseDependencies(aDirectives) {
	return aDirectives
		.map(function(aDirective) {
			var name = aDirective.match(/^\w+/)[0];

			if (!DIRECTIVE_PARSERS[name]) {
				// skip JSHint directives
				return;
			}

			return DIRECTIVE_PARSERS[name](aDirective);
		})
		.filter(isTruthy);
}

function parse(aFileName) {
	var dependencyManager = new DependencyManager();

	var mainImport = 'import ' + aFileName.replace(/\.js$/i, '');
	var mainDirective = DIRECTIVE_PARSERS.import(mainImport);

	var next = mainDirective;
	for (; next; next = dependencyManager.nextUnresolved()) {
		var contents = readFile(next.path);

		if (!contents) {
			// TODO: issue an error
			// resolve dependency
			dependencyManager.add(next.path, 'Error: File not found', []);
			continue;
		}

		if (next.type === 'resource') {
			dependencyManager.add(next, contents, []);
			continue;
		}

		var sourceInfo = parseSource(contents);
		var dependencies = parseDependencies(sourceInfo.directives);

		dependencyManager.add(next, sourceInfo.source, dependencies);
	}

	dependencyManager.setMainModule(mainDirective.path);

	return dependencyManager;
}

module.exports.parse = parse;
