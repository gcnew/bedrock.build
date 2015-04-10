var strtr = require('./util/strtr');
var mapKeys = require('./util/mapKeys');

var PREFIXES = {
	error: 'ERROR: '
};

var Diagnostics = {
	file_not_found: "File '$path' not found!",
	syntax_error: '$path: $message',
	invalid_main: 'Invalid starting point (input): $path'
};

function faultMessage(aFault) {
	var prefix = PREFIXES[aFault.type] || '';

	var message = aFault.code
		? strtr(
			Diagnostics[aFault.code] || '$code',
			mapKeys(aFault, function(aKey) {
				return '$' + aKey;
			})
		)
		: aFault.message || 'an error occurred';

	return prefix + message;
}

exports.Diagnostics = Diagnostics;
exports.faultMessage = faultMessage;
