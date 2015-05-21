// import util/strtr

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

		this.resource = stick_all('resource', 'ws', '(identifier)', ':', 'path');

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
				ids: 'all',
				name: match[1],
				path: match[2]
			};
		}
	};
})();
