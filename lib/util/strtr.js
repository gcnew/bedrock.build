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

		return strtr(aString, translations, aMapper);
	}

	var mapper = aTo || id;
	var keys = Object.keys(aTranslations)
		.sort(cmpDescendingLength)
		.map(escapeRx);

	var keysRx = new RegExp('(' + keys.join('|') + ')', 'g');

	return aString.replace(keysRx, function(_, aKey) {
		return mapper(aTranslations[aKey], aKey);
	});
}

// del me
module.exports = strtr;
