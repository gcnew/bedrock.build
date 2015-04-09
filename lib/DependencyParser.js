var fs = require('fs');
var extend = require('./util/extend');
var partition = require('./util/partition');
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

function parseErrors(aErrors) {
	return {
		hasFatal: true,
		errors: Array.isArray(aErrors) ? aErrors : [ aErrors ]
	};
}

function parseError(aCode, aPath) {
	return {
		path: aPath,
		code: aCode,
		type: 'error'
	};
}

var invalidMainFile = parseError.bind(null, 'invalid_main');

var fileNotFound = parseError.bind(null, 'file_not_found');

function directiveSyntaxError(aPath, aError) {
	return extend(parseError('syntax_error', aPath), aError);
}

function parse(aFileName) {
	var dependencyManager = new DependencyManager();

	var errors = [];
	var mainImport = 'import ' + aFileName.replace(/\.js$/i, '');
	var mainDirective = DIRECTIVE_PARSERS.import(mainImport);

	if (mainDirective.type !== 'import') {
		return parseErrors(invalidMainFile(aFileName));
	}

	var next = mainDirective;
	for (; next; next = dependencyManager.nextUnresolved()) {
		var contents = readFile(next.path);

		if (!contents) {
			errors.push(fileNotFound(next.path));

			// resolve dependency
			dependencyManager.add(next, null, []);
			continue;
		}

		if (next.type === 'resource') {
			dependencyManager.add(next, contents, []);
			continue;
		}

		if (next.type !== 'import') {
			throw new Error('Unimplemented type handler: ' + next.type);
		}

		var sourceInfo = parseSource(contents);
		var dependencies = parseDependencies(sourceInfo.directives);

		var deps_errors = partition(dependencies, function(aDependency) {
			return aDependency.type !== 'error';
		});

		errors = errors.concat(deps_errors[1].map(
			directiveSyntaxError.bind(null, next.path)
		));

		dependencyManager.add(next, sourceInfo.source, deps_errors[0]);
	}

	if (errors.length) {
		return parseErrors(errors);
	}

	dependencyManager.setMainModule(mainDirective.path);

	return dependencyManager;
}

module.exports.parse = parse;
