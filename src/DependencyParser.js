// import util/extend
// import util/groupBy
// import util/concatMap
// import DependencyManager
// import DirectiveParsers

// export (parse)

var fs = require('fs'); // node_import fs
var Path = require('path');

function readFile(aFileName) {
	try {
		return fs.readFileSync(aFileName, 'utf8');
	} catch(e) {
		return null;
	}
}

function isTruthy(aObject) {
	return !!aObject;
}

var DIRECTIVES_PREFIX_RX = new RegExp(
	'^(directives|globals?|jshint|exported) '
		.replace('directives', Object.keys(DirectiveParsers).join('|'))
);
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

			if (!DirectiveParsers[name]) {
				// skip JSHint directives
				return;
			}

			return DirectiveParsers[name](aDirective);
		})
		.filter(isTruthy);
}

function isRelative(aPath) {
	return /^\./.test(aPath);
}

function resolvePath(aBase, aPath) {
	if (!isRelative(aPath)) {
		return aPath;
	}

	var path = Path.normalize(aBase + '/' + aPath)
		.replace(/\\/g, '/');

	// invalid path - goes deeper than root
	if (isRelative(path)) {
		return null;
	}

	return path;
}

function parseErrors(aErrors) {
	return {
		hasFatal: true,
		errors: Array.isArray(aErrors) ? aErrors : [ aErrors ]
	};
}

function parseError(aCode, aPath, aProps) {
	return extend({
		path: aPath,
		code: aCode,
		type: 'error'
	}, aProps);
}

var invalidMainFile = parseError.bind(null, 'invalid_main');

var fileNotFound = parseError.bind(null, 'file_not_found');

var invalidImportPath = parseError.bind(null, 'invalid_import_path');

var directiveSyntaxError = parseError.bind(null, 'syntax_error');

function parse(aRoot, aFileName) {
	var root, fileName;

	if (aRoot) {
		root = Path.resolve(aRoot);

		// TODO: fileName may not be relative to root or may be more shallow
		fileName = aFileName;
	} else {
		var absName = Path.resolve(aFileName);

		root = Path.dirname(absName);
		fileName = Path.basename(absName);
	}

	return parse0(root, fileName);
}

function parse0(aRoot, aFileName) {
	var dependencyManager = new DependencyManager();

	var mainImport = 'import ' + aFileName.replace(/\.js$/i, '');
	var mainDirective = DirectiveParsers.import(mainImport);

	if (mainDirective.type !== 'import') {
		return parseErrors(invalidMainFile(aFileName));
	}

	dependencyManager.setMain(mainDirective);

	return collectDependencies(aRoot, dependencyManager);
}

function collectDependencies(aRoot, dependencyManager) {
	var errors = [];

	for (var next; next = dependencyManager.nextUnresolved();) {
		var contents = readFile(aRoot + '/' + next.path);

		if (!contents) {
			errors.push(fileNotFound(next.path, {
				refs: next.refs
			}));

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

		var basePath = Path.dirname(next.path);
		dependencies = dependencies.map(function(aDependency) {
			if (aDependency.path) {
				var path = resolvePath(basePath, aDependency.path);

				if (!path) {
					return invalidImportPath(next.path, {
						import_path: aDependency.path
					});
				}

				aDependency.path = path;
			}

			return aDependency;
		});

		var groups = groupBy(dependencies, function(aDependency) {
			return aDependency.type;
		});

		errors = errors.concat((groups['error'] || []).map(
			directiveSyntaxError.bind(null, next.path)
		));

		if (!groups['export']) {
			next.exports = 'all';
		} else {
			var exports = concatMap(groups['export'], function(aX) {
				return aX.ids;
			});

			next.exports = exports.length ? exports : 'none';
		}

		var nonErrors = (groups['import'] || []).concat(groups['resource'] || []);
		dependencyManager.add(next, sourceInfo.source, nonErrors);
	}

	if (errors.length) {
		return parseErrors(errors);
	}

	return dependencyManager;
}
