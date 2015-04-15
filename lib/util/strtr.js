// import ./escapeRx

var escapeRx = require('./escapeRx.js');

function id(aX) {
	return aX;
}

function cmpDescendingLength(aX, aY) {
	return aY.length - aX.length;
}

/**
 * overloads:
 *   strtr(String string, String from, String to): String
 *   strtr(String string, Dictionary<String, Object> translations): String
 */
function strtr(aString, aTranslations, aTo, aMapper) {
	if (typeof(aTranslations) === 'string') {
		var translations = {};
		translations[aTranslations] = aTo;

		return strtr(aString, translations);
	}

	var mapper = aTo || id;
	return Object.keys(aTranslations)
		.sort(cmpDescendingLength)
		.reduce(function(aAcc, aFrom) {
			var fromRx = new RegExp(escapeRx(aFrom), 'g');
			var val = mapper(aTranslations[aFrom], aFrom);
			var to = String(val).replace(/\$/g, '$$$$');

			return aAcc.replace(fromRx, to);
		}, aString);
}

// del me
module.exports = strtr;
