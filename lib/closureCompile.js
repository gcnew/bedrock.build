// import util/strtr
// import util/extend
// import util/concatMap

var strtr = require('./util/strtr.js');
var extend = require('./util/extend.js');
var concatMap = require('./util/concatMap.js');

var fs = require('fs');

var PROLOGUE = 'var $registry_name = {};\n\n';

var MODULE_TEMPLATE =
	"$slot = (function($params) {\n" +
		'$source\n' +
		'return $exports;\n' +
	'})($args);\n\n';

var RESOURCE_TEMPLATE = "$slot = '$source';\n\n";

var EPILOGUE =
	"if (typeof($main_module) === 'function') {\n" +
	'	return $main_module.call(this);\n' +
	'} else if ($main_module) {\n' +
	'	return $main_module.main.call(this);\n' +
	'} else {\n' +
	'	return $main_module;\n' +
	'}\n';

function pathToSlot(aRegistry, aPath) {
	return strtr("registry['path']", {
		registry: aRegistry,
		path: aPath
	});
}

function compile(aRegistry, aItem) {
	var moduleSlot = pathToSlot(aRegistry, aItem.path);

	if (aItem.type === 'resource') {
		var source = aItem.source
			.replace(/\\/g, '\\\\')
			.replace(/\'/g, '\\\'')
			.replace(/\r/g, '\\r')
			.replace(/\n/g, '\\n');

		return strtr(RESOURCE_TEMPLATE, {
			$slot: moduleSlot,
			$source: source
		});
	}

	var params = concatMap(aItem.dependencies, function(aDependency) {
		return aDependency.ids === 'all'
			? [ aDependency.name ]
			: aDependency.ids;
	})
	.join(', ');

	var args = concatMap(aItem.dependencies, function(aDependency) {
		var slot = pathToSlot(aRegistry, aDependency.path);

		return aDependency.ids === 'all'
			? [ slot ]
			: aDependency.ids.map(function(aX) {
				return slot + '.' + aX;
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
		$slot: moduleSlot,
		$params: params,
		$source: aItem.source,
		$exports: exports,
		$args: args
	});
}

var hash = (function() {
	var ALPHABET = 'abcdefghijklnmopqrstuvwxyz';
	ALPHABET += ALPHABET.toUpperCase();
	ALPHABET += '0123456789';

	return function(aLength) {
		var retval = '';

		for (var i = aLength; i > 0; i--) {
			var rnd = Math.floor(Math.random() * ALPHABET.length);

			retval += ALPHABET[rnd];
		}

		return retval;
	};
})();

function createRegistryName() {
	return '__registry_' + hash(4);
}

function closureCompile(aDependencyManager, aPath) {
	var registry = createRegistryName();
	var retval = strtr(PROLOGUE, {
		$registry_name: registry
	});

	aDependencyManager.traverseDependencies(function(aDependency) {
		retval += compile(registry, aDependency);
	});

	retval += strtr(EPILOGUE, {
		$main_module: pathToSlot(registry, aDependencyManager.getMain().path)
	});

	fs.writeFileSync(aPath, retval);

	return true;
}

//del me
module.exports = closureCompile;
