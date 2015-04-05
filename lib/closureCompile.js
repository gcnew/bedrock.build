var strtr = require('./util/strtr.js');
var extend = require('./util/extend.js');

var MODULE_TEMPLATE =
	'var $module_name = (function($params) {\n' +
		'$source\n' +
		'return $name;\n' +
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

function compile(aItem, aMain) {
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

	var params = aItem.dependencies
		.map(function(aDependency) {
			return aDependency.name;
		})
		.join(', ');

	var args = aItem.dependencies
		.map(function(aDependency) {
			return pathToName(aDependency.path);
		})
		.join(', ');

	var template = aMain ? MAIN_MODULE_TEMAPLATE : MODULE_TEMPLATE;
	return strtr(template, {
		$module_name: moduleName,
		$params: params,
		$source: aItem.source,
		$name: aItem.name,
		$args: args
	});
}

function closureCompile(aDependencyManager) {
	var compiled = {};
	var left = extend({}, aDependencyManager.dependencies);

	var isCompiled = function(aDependency) {
		return aDependency.path in compiled;
	};

	var isMain = function(aItem) {
		return aItem === aDependencyManager.mainModule;
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
				retval += compile(item, isMain(item));

				compiled[aKey] = true;
				delete left[aKey];
			}
		});
	}

	retval += strtr(INVOKE_TEMPLATE, {
		$main_module: pathToName(aDependencyManager.mainModule.path)
	});

	return retval;
}

module.exports = closureCompile;
