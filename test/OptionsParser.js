var assert = require('chai').assert;
var OptionsParser = require('../lib/OptionsParser');

describe('OptionsParser', function() {

	var options = OptionsParser.parse(process.argv.slice(2), {
		help: [ '--help', '-h'],
		base: [ '=', '--base', '-b' ],
		fileIn: [ '=', '--input', '-i', '$0' ],
		fileOut: [ '=', '--output', '-o', '$1' ],
		compiler: [ '=', '--compiler', '-c' ],
		unknown: [ '!' ]
	});

	describe('#parse()', function() {
		var argv = [
			'infile.txt',
			'--input=infile2.txt',
			'outfile.txt',
			'-o=outfile2.txt',
			'-i'
		];

		it('collect unknown options', function() {
			var options = OptionsParser.parse(argv, {
				unknown: [ '!' ]
			});

			assert.deepEqual(options.unknown, argv); 
		});

		it('ignore unknown options if not needed', function() {
			var options = OptionsParser.parse(argv, {});

			assert.deepEqual(options, {}); 
		});

		it('undefined when missing arguments', function() {
			var options = OptionsParser.parse(argv, {
				input: [ '=', '-i' ]
			});

			assert.notOk(options.input);
		});

		it('parse positional arguments', function() {
			var options = OptionsParser.parse(argv, {
				input: [ '=', '$0' ],
				skipInput: [ '=', '--input' ],
				output: [ '=', '$1' ]
			});

			assert.equal(options.input, 'infile.txt');
			assert.equal(options.output, 'outfile.txt');
			assert.equal(options.skipInput, 'infile2.txt');
		});

		it('override with later bindings', function() {
			var options = OptionsParser.parse(argv, {
				input: [ '=', '--input', '$0' ],
				output: [ '=', '-o', '$1' ]
			});

			assert.equal(options.input, 'infile2.txt');
			assert.equal(options.output, 'outfile2.txt');
		});

		it('skip already provided positions', function() {
			var options = OptionsParser.parse(argv, {
				input: [ '=', '$0' ],
				input2: [ '=', '--input', '$1' ],
				output: [ '=', '$2' ]
			});

			assert.equal(options.input, 'infile.txt');
			assert.equal(options.output, 'outfile.txt');
		});

		it('order and overlaps don\'t matter', function() {
			var input = [ '-input=123' ];
			var def = [ '=', '-i', '-input' ];

			var options1 = OptionsParser.parse(input, { input: def });
			var options2 = OptionsParser.parse(input, { input: def.reverse() });

			assert.deepEqual(options1, options2);
			assert.equal(options1.input, '123');
		});
	});
});
