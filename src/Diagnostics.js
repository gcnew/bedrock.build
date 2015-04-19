// import util/strtr
// import util/mapKeys

// export (Diagnostics, faultMessage)

var PREFIXES = {
	error: 'ERROR: '
};

var Diagnostics = {
	file_not_found: "File '$path' not found!\n    Referenced by: $refs",
	syntax_error: '$path: $message',
	invalid_main: 'Invalid starting point (input): $path',
	invalid_import_path: '$path: Invalid import or resource path: $import_path'
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
