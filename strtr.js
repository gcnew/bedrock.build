var escapeRx = require('./escapeRx.js');

/**
 * overloads:
 *   strtr(String string, String from, String to): String
 *   strtr(String string, Dictionary<String, Object> translations): String
 */
function strtr(aString, aTranslations, aTo) {
	if (typeof(aTranslations) === 'string') {
		var translations = {};
		translations[aTranslations] = aTo;

		return strtr(aString, translations);
	}

	return Object.keys(aTranslations)
		.reduce(function(aAcc, aFrom) {
			var fromRx = new RegExp(escapeRx(aFrom), 'g');
			var to = String(aTranslations[aFrom]).replace(/\$/g, '$$$$');

			return aAcc.replace(fromRx, to);
		}, aString);
}

module.exports = strtr;
