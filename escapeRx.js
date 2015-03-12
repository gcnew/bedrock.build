// Taken from Mozilla's RegExp guide
function escapeRx(aString) {
	return aString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRx;
