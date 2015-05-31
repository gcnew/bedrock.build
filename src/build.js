// import OptionsParser
// import nodeCompile
// import closureCompile
// import DependencyParser
// import Diagnostics (faultMessage)

// export ()

var fs = require('fs');
var path = require('path');

var COMPILERS = {
	node: nodeCompile,
	closure: closureCompile
};

function parseArguments() {
	// TODO: consider: https://github.com/jiangmiao/node-getopt

	var options = OptionsParser.parse(process.argv.slice(2), {
		help: [ '--help', '-h'],
		base: [ '=', '--base', '-b' ],
		fileIn: [ '=', '--input', '-i', '$0' ],
		fileOut: [ '=', '--output', '-o', '$1' ],
		compiler: [ '=', '--compiler', '-c' ],
		unknown: [ '!' ]
	});

	if (options.unknown) {
		console.log('Error: unknown options: ' + options.unknown.join(', '));
		return;
	}

	if (options.help || !options.fileIn) {
		printUsage();
		process.exit(0);
	}

	if (!options.fileOut) {
		var match = options.fileIn.match(/^(?:[\w.]+\/)*([\w.]+)(\.\w+)/);

		if (!match) {
			console.log('Error: Ivalid input file: ' + options.fileIn);
			return;
		}

		options.fileOut = match[1] + (match[2] ? ('.out' + match[2]) : '.out.js');
	}

	options.compiler = options.compiler || 'closure';
	if (options.compiler in COMPILERS) {
		options.compiler = COMPILERS[options.compiler];
	} else { 
		if (!fs.existsSync(options.compiler)) {
			console.log('Error: Invalid compiler: ' + options.compiler);
			return;
		}

		var cp = path.relative(__dirname, options.compiler);
		var compiler = require('./' + cp);
		if (typeof(compiler) !== 'function') {
			console.log('Error: Invalid compiler - function expected: ' + options.compiler);
			return;
		}

		options.compiler = compiler;
	}

	return options;
}

function printUsage() {
	var compilers = Object.keys(COMPILERS).join('|');

	console.log('Usage: build [options] <in file> [<out file>]');
	console.log();
	console.log('Options:');
	console.log('  -i, --input       name of the input file');
	console.log('  -o, --output      name of the input file');
	console.log('  -b, --base        the base path of the project');
	console.log('  -c, --compiler    ' + compilers + ' - the compiler to be used');
	console.log('  -h, --help        shows this message');
}

function main() {
	var args = parseArguments();

	if (!args) {
		process.exit(1);
	}

	console.log('Building source: ' + args.fileIn);
	var dependencyManager = DependencyParser.parse(args.base, args.fileIn);

	if (dependencyManager.hasFatal) {
		dependencyManager.errors.forEach(function(aError) {
			console.log(faultMessage(aError));
		});

		process.exit(1);
	}

	args.compiler(dependencyManager, args.fileOut);
}

main();
