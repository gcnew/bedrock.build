var cm__OptionsParser_js = (function() {
var OptionsParser = (function() {
	function parseOptions(aOptions) {
		var unknown;
		var aliases = [];
		var hasValue = {};
		var alias2name = {};

		var options = Array.isArray(aOptions) ? aOptions : [ aOptions ];
		options.forEach(function(aOption) {
			Object.keys(aOption).forEach(function(aName) {
				aOption[aName].forEach(function(aAlias) {
					if (aAlias === '!') {
						unknown = aName;
						return;
					}

					if (aAlias === '=') {
						hasValue[aName] = true;
						return;
					}

					alias2name[aAlias] = aName;
					if (aAlias[0] !== '$') {
						aliases.push(aAlias);
					}
				});
			});
		});

		aliases.sort(function(aX, aY) {
			return aY.length - aX.length;
		});

		return {
			unknown: unknown,
			aliases: aliases,
			hasValue: hasValue,
			alias2name: alias2name
		};
	}

	function parseArguments(aArguments, aOptions) {
		var options = parseOptions(aOptions);

		var idx = 0;
		var retval = {};
		for (var i = 0; i < aArguments.length; ++i) {
			var arg = aArguments[i];

			var alias = options.aliases
				.filter(function(aName) {
					return arg.indexOf(aName) === 0;
				})
				.pop();

			if (alias) {
				// handle named arguments
				var optionName = options.alias2name[alias];

				retval[optionName] = options.hasValue[optionName]
					? (arg[alias.length] === '=')
						? arg.substr(alias.length + 1)	// immediate (prefixed) value
						: aArguments[++i]				// next (following) value
					: true;
			} else {
				// handle positional arguments
				var optionName;

				// skip already taken positions
				do {
					optionName = options.alias2name['$' + idx++];
				} while (optionName && (optionName in retval));

				if (optionName) {
					retval[optionName] = arg;
				} else if (options.unknown) {
					retval[options.unknown] = retval[options.unknown] || [];
					retval[options.unknown].push(arg);
				}
			}
		}

		return retval;
	}

	return {
		parse: parseArguments
	};
})();

// del me


return OptionsParser;
})();

var cm__util__extend_js = (function() {
function extend(aTartget /*, ..args */) {
	for (var i = 0; i < arguments.length; ++i) {
		var arg = arguments[i];

		for (var k in arg) {
			aTartget[k] = arg[k];
		}
	}

	return aTartget;
}

// del me


return extend;
})();

var cm__util__concatMap_js = (function() {
function concatMap(aArray, aMappper, aThis) {
	return Array.prototype.concat.apply([], aArray.map(aMappper, aThis));
}

// del me


return concatMap;
})();

var cm__util__groupBy_js = (function() {
function groupBy(aArray, aFunc, aThis) {
	return aArray.reduce(function(aAcc, aValue) {
		var key = aFunc.call(aThis, aValue);

		var group = aAcc[key] = aAcc[key] || [];
		group.push(aValue);

		return aAcc;
	}, {});
}

// del me


return groupBy;
})();

var cm__DependencyManager_js = (function(extend) {


function DependencyManager() {
	this.dependencies = {};

	this.unresolved = {};
}

extend(DependencyManager.prototype, {
	isResolved: function(aDependency) {
		return !this.isUnresolved(aDependency);
	},

	isUnresolved: function(aDependency) {
		return !(aDependency.path in this.dependencies)
			|| (aDependency.path in this.unresolved);
	},

	add: function(aDirective, aSource, aDependencies) {
		var path = aDirective.path;

		if (this.dependencies[path]) {
			throw new Error('Dependency already added: ' + path);
		}

		this.dependencies[path] = extend({
			source: aSource,
			dependencies: aDependencies
		}, aDirective);

		aDependencies
			.filter(this.isUnresolved, this)
			.forEach(function(aDependency) {
				this.unresolved[aDependency.path] = extend({
					refs: []
				}, aDependency);
			}, this);

		aDependencies.forEach(function(aDependency) {
			var path = aDependency.path;
			var dep = this.dependencies[path] || this.unresolved[path];

			dep.refs.push(aDirective.path);
		}, this);

		// OK, all our dependencies are added for resolution
		delete this.unresolved[path];
	},

	nextUnresolved: function() {
		for (var retval in this.unresolved) {
			return this.unresolved[retval];
		}
	}
});

// del me


return DependencyManager;
})(cm__util__extend_js);

var cm__util__mapKeys_js = (function() {
function mapKeys(aObject, aMapper, aThis) {
	return Object.keys(aObject).reduce(function(aAcc, aKey) {
		aAcc[aMapper.call(aThis, aKey)] = aObject[aKey];
		return aAcc;
	}, {});
}

// del me


return mapKeys;
})();

var cm__util__escapeRx_js = (function() {
// Taken from Mozilla's RegExp guide
function escapeRx(aString) {
	return aString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// del me


return escapeRx;
})();

var cm__util__strtr_js = (function(escapeRx) {


function id(aX) {
	return aX;
}

function cmpDescendingLength(aX, aY) {
	return aY.length - aX.length;
}

/**
 * overloads:
 *   strtr(String string, String from, String to): String
 *   strtr(String string, Dictionary<String, Object> translations): String
 */
function strtr(aString, aTranslations, aTo, aMapper) {
	if (typeof(aTranslations) === 'string') {
		var translations = {};
		translations[aTranslations] = aTo;

		return strtr(aString, translations);
	}

	var mapper = aTo || id;
	var keys = Object.keys(aTranslations)
		.sort(cmpDescendingLength)
		.map(escapeRx);

	var keysRx = new RegExp('(' + keys.join('|') + ')', 'g');

	return aString.replace(keysRx, function(_, aKey) {
		// String(val).replace(/\$/g, '$$$$');
		return mapper(aTranslations[aKey], aKey);
	});
}

// del me


return strtr;
})(cm__util__escapeRx_js);

var cm__DirectiveParsers_js = (function(strtr) {


var DirectiveParsers = (function() {
	function error(aMessage) {
		return {
			type: 'error',
			message: aMessage
		};
	}

	var rxs = new function() {
		var self = this;

		this.ws = / |\t/;

		this.identifier = /[a-zA-Z_\$][a-zA-Z0-9_\$]*/;

		this.idGlobal = new RegExp(this.identifier.source, 'g');

		this.filename = this.identifier;

		this.ext = stick('\\.identifier');

		this.fileExt = stick('filename', 'ext');

		this.relative = /\.\.?/;

		this.path = stick('((?:relative\\/)*(?:filename\\/)*fileExt)');

		this.pathFilename = stick('((?:relative\\/)*(?:filename\\/)*(filename))');

		this.emptyList = stick_ws('\\(', '\\)');

		this.idList = stick_ws('\\((', 'identifier', '(?:\\,', 'identifier)*', ')\\)');

		this.import = stick_all('import', 'ws', 'pathFilename', '(?:ws', 'idList)?');

		this.export = stick_all('export', 'ws', 'idList|emptyList');

		this.resource = stick_all('resource', 'ws', 'identifier', ':', 'path');

		function stick() {
			var sourceItems = Array.prototype.slice.call(arguments)
				.map(function(aItem) {
					return strtr(aItem, self, function(aValue) {
						return '(?:' + aValue.source + ')';
					});
				});

			return new RegExp(sourceItems.join(''));
		}

		function stick_ws() {
			var interleaved = Array.prototype.slice.call(arguments)
				.reduce(function(aAcc, aItem) {
					aAcc.push(aItem);
					aAcc.push('ws*');

					return aAcc;
				}, []);

			// pop the trailing whitespace
			interleaved.pop();

			return stick.apply(null, interleaved);
		}

		function stick_all() {
			return new RegExp('^' + stick_ws.apply(null, arguments).source + '$');
		}
	};

	return {
		import: function(aSource) {
			var match = rxs.import.exec(aSource);

			if (!match) {
				return error('Invalid import syntax: ' + aSource);
			}

			var ids = match[3]
				? match[3].match(rxs.idGlobal)
				: 'all';

			return {
				type: 'import',
				ids: ids,
				name: match[2],
				path: match[1] + '.js'
			};
		},

		export: function(aSource) {
			var match = rxs.export.exec(aSource);

			if (!match) {
				return error('Invalid export syntax: ' + aSource);
			}

			var exports = match[1]
				? match[1].match(rxs.idGlobal)
				: [];

			return {
				type: 'export',
				ids: exports
			};
		},

		resource: function(aSource) {
			var match = rxs.resource.exec(aSource);

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

// del me


return DirectiveParsers;
})(cm__util__strtr_js);

var cm__closureCompile_js = (function(strtr, extend, concatMap) {




var fs = require('fs');

var MODULE_TEMPLATE =
	'var $module_name = (function($params) {\n' +
		'$source\n' +
		'return $exports;\n' +
	'})($args);\n\n';

var MAIN_MODULE_TEMAPLATE = strtr(MODULE_TEMPLATE, {
	'$name': 'typeof($name) !== \'undefined\' ? $name : (void 0)'
});

var RESOURCE_TEMPLATE = 'var $module_name = \'$source\';\n\n';

var INVOKE_TEMPLATE =
	'if (typeof($main_module) === \'function\') {\n' +
	'	$main_module.call(this);\n' +
	'} else if ($main_module) {\n' +
	'	$main_module.main.call(this);\n' +
	'}\n';

function pathToName(aPath) {
	var unprefixed = aPath
		.replace(/\./g, '_')
		.replace(/\//g, '__');

	return 'cm__' + unprefixed;
}

function compile(aItem) {
	var moduleName = pathToName(aItem.path);

	if (aItem.type === 'resource') {
		return strtr(RESOURCE_TEMPLATE, {
			$module_name: moduleName,
			$source: aItem.source
				.replace(/\\/g, '\\\\')
				.replace(/\'/g, '\\\'')
				.replace(/\r/g, '\\r')
				.replace(/\n/g, '\\n')
		});
	}

	var params = concatMap(aItem.dependencies, function(aDependency) {
		return aDependency.ids === 'all'
			? [ aDependency.name ]
			: aDependency.ids;
	})
	.join(', ');

	var args = concatMap(aItem.dependencies, function(aDependency) {
		var identifier = pathToName(aDependency.path);

		return aDependency.ids === 'all'
			? [ identifier ]
			: aDependency.ids.map(function(aX) {
				return identifier + '.' + aX;
			});
	})
	.join(', ');

	var exports;
	if (aItem.exports === 'all') {
		exports = aItem.name;
	} else if (aItem.exports === 'none') {
		exports = 'void(0)';
	} else {
		var parts = aItem.exports
			.map(function(aX) {
				return aX + ': ' + aX;
			});

		exports = '{\n\t' + parts.join(',\n\t') + '\n}';
	}

	return strtr(MODULE_TEMPLATE, {
		$module_name: moduleName,
		$params: params,
		$source: aItem.source,
		$exports: exports,
		$args: args
	});
}

function closureCompile(aDependencyManager, aPath) {
	var compiled = {};
	var left = extend({}, aDependencyManager.dependencies);
	var mainModule = aDependencyManager.dependencies['.main'];

	var isCompiled = function(aDependency) {
		return aDependency.path in compiled;
	};

	var isMain = function(aItem) {
		return aItem === mainModule;
	};

	var retval = '';
	while (true) {
		var keys = Object.keys(left);

		if (!keys.length) {
			break;
		}

		keys.forEach(function(aKey) {
			var item = left[aKey];

			if (item.dependencies.every(isCompiled)) {
				if (!isMain(item)) {
					retval += compile(item);
				}

				compiled[aKey] = true;
				delete left[aKey];
			}
		});
	}

	retval += strtr(INVOKE_TEMPLATE, {
		$main_module: pathToName(mainModule.dependencies[0].path)
	});

	fs.writeFileSync(aPath, retval);

	return true;
}

//del me


return closureCompile;
})(cm__util__strtr_js, cm__util__extend_js, cm__util__concatMap_js);

var cm__DependencyParser_js = (function(extend, groupBy, concatMap, DependencyManager, DirectiveParsers) {






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

	dependencyManager.add({ path: '.main' }, null, [ mainDirective ]);

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

		dependencyManager.add(next, sourceInfo.source, groups['import'] || []);
	}

	if (errors.length) {
		return parseErrors(errors);
	}

	return dependencyManager;
}

// del me
module.exports.parse = parse;

return {
	parse: parse
};
})(cm__util__extend_js, cm__util__groupBy_js, cm__util__concatMap_js, cm__DependencyManager_js, cm__DirectiveParsers_js);

var cm__Diagnostics_js = (function(strtr, mapKeys) {



var PREFIXES = {
	error: 'ERROR: '
};

var Diagnostics = {
	file_not_found: "File '$path' not found!\n    Referenced by: $refs",
	syntax_error: '$path: $message',
	invalid_main: 'Invalid starting point (input): $path',
	invalid_import_path: '$path: Invalid import or resource path: $import_path'
};

function faultMessage(aFault) {
	var prefix = PREFIXES[aFault.type] || '';

	var message = aFault.code
		? strtr(
			Diagnostics[aFault.code] || '$code',
			mapKeys(aFault, function(aKey) {
				return '$' + aKey;
			})
		)
		: aFault.message || 'an error occurred';

	return prefix + message;
}

//del me
exports.Diagnostics = Diagnostics;
exports.faultMessage = faultMessage;

return {
	Diagnostics: Diagnostics,
	faultMessage: faultMessage
};
})(cm__util__strtr_js, cm__util__mapKeys_js);

var cm__build_js = (function(OptionsParser, closureCompile, DependencyParser, faultMessage) {
var fs = require('fs');





function parseArguments() {
	// TODO: consider: https://github.com/jiangmiao/node-getopt

	var options = OptionsParser.parse(process.argv.slice(2), {
		help: [ '--help', '-h'],
		base: [ '=', '--base', '-b' ],
		fileIn: [ '=', '--input', '-i', '$0' ],
		fileOut: [ '=', '--output', '-o', '$1' ],
		unknown: [ '!' ]
	});

	if (options.unknown) {
		console.log('Error: unknown options: ' + options.unknown.join(', '));
		return;
	}

	if (options.help || !options.fileIn) {
		printUsage();
		return;
	}

	if (!options.fileOut) {
		var match = options.fileIn.match(/^(?:[\w.]+\/)*([\w.]+)(\.\w+)/);

		if (!match) {
			console.error('Ivalid input file: ' + options.fileIn);
			return;
		}

		options.fileOut = match[1] + (match[2] ? ('.out' + match[2]) : '.out.js');
	}

	return options;
}

function printUsage() {
	console.log('Usage: build <in file> [<out file>]');
	console.log();
	console.log('Options:');
	console.log('  -i, --input       name of the input file');
	console.log('  -o, --output      name of the input file');
	console.log('  -b, --base        the base path of the project');
	console.log('  -h, --help        shows this message');
}

function main() {
	var args = parseArguments();

	if (!args) {
		return;
	}

	console.log('Building source: ' + args.fileIn);
	var dependencyManager = DependencyParser.parse(args.base, args.fileIn);

	if (dependencyManager.hasFatal) {
		dependencyManager.errors.forEach(function(aError) {
			console.log(faultMessage(aError));
		});

		return;
	}

	var compiledSource = closureCompile(dependencyManager, args.fileOut);
}

// del me
main();

return void(0);
})(cm__OptionsParser_js, cm__closureCompile_js, cm__DependencyParser_js, cm__Diagnostics_js.faultMessage);

if (typeof(cm__build_js) === 'function') {
	cm__build_js.call(this);
} else if (cm__build_js) {
	cm__build_js.main.call(this);
}
