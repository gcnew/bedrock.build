/*jshint node:true */

var fs = require('fs');
var OptionsParser = require('./OptionsParser');
var closureCompile = require('./closureCompile');
var DependencyParser = require('./DependencyParser');

function parseArguments() {
	// TODO: consider: https://github.com/jiangmiao/node-getopt

	var options = OptionsParser.parse(process.argv.slice(2), {
		help: [ '--help', '-h'],
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
	console.log('  -h, --help        shows this message');
}

function main() {
	var args = parseArguments();

	if (!args) {
		return;
	}

	console.log('Building source: ' + args.fileIn);
	var dependencyManager = DependencyParser.parse(args.fileIn);

	var compiledSource = closureCompile(dependencyManager);
	fs.writeFileSync(args.fileOut, compiledSource);
}

main();
