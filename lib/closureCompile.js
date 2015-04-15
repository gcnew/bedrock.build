// import util/strtr
// import util/extend
// import util/concatMap

var strtr = require('./util/strtr.js');
var extend = require('./util/extend.js');
var concatMap = require('./util/concatMap.js');

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
module.exports = closureCompile;
