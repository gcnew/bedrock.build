// TODO: consider: https://github.com/jiangmiao/node-getopt

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

module.exports = OptionsParser;
