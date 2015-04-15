/*jshint node:true */

// import OptionsParser
// import closureCompile
// import DependencyParser
// import Diagnostics (faultMessage)

// export ()

var fs = require('fs');
var OptionsParser = require('./OptionsParser');
var closureCompile = require('./closureCompile');
var DependencyParser = require('./DependencyParser');
var faultMessage = require('./Diagnostics').faultMessage;

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
