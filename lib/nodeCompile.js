
// import util/strtr
// import util/concatMap

var strtr = require('./util/strtr');
var concatMap = require('./util/concatMap');

var fs = require('fs');
var Path = require('path');

var REQUIRE_TEMPLATE = "var $name = require('$path');\n";
var REQUIRE_PROP_TEMPLATE = "var $name = require('$path').$property;\n";
var EXPORTS_TEMPLATE = "module.exports = $exports;\n";
var SOURCE_TEMPLATE = "$requires$source\n$exports";

function requires(aItem) {
	var retval = concatMap(aItem.dependencies, function(aDependency) {
		var relpath = Path.relative(
			Path.dirname(aItem.path),
			aDependency.path
		).replace(/\\/g, '/');

		if (relpath[0] !== '.') {
			relpath = './' + relpath;
		}

		if (aDependency.ids === 'all') {
			return [ strtr(REQUIRE_TEMPLATE, {
				$name: aDependency.name,
				$path: relpath
			}) ];
		}

		return aDependency.ids.map(function(aId) {
			return strtr(REQUIRE_PROP_TEMPLATE, {
				$name: aId,
				$path: relpath,
				$property: aId
			});
		});
	})
	.join('');

	return retval && retval + '\n';
}

function exports(aItem) {
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

	return strtr(EXPORTS_TEMPLATE, '$exports', exports);
}

function mkdirs(aPath) {
	if (!fs.exists(aPath)) {
		var parent = Path.dirname(aPath);

		if (aPath === '..' || parent === aPath) {
			// .|..|/|c:\\
			// this should never happen, but just in case
			return;
		}

		mkdirs(parent);
		fs.mkdirSync(aPath);
	}
}

function writeFile(aPath, aData) {
	var dir = Path.dirname(aPath);

	if (!fs.existsSync(dir)) {
		mkdirs(dir);
	}

	fs.writeFileSync(aPath, aData);
}

function compile(aPath, aItem) {
	var source = strtr(SOURCE_TEMPLATE, {
		$requires: requires(aItem),
		$source: aItem.source,
		$exports: exports(aItem)
	});

	writeFile(aPath + '/' + aItem.path, source);
}

function nodeCompile(aDependencyManager, aPath) {
	aDependencyManager.traverseDependencies(compile.bind(null, aPath));
}

module.exports = nodeCompile;
