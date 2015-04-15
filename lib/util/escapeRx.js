// Taken from Mozilla's RegExp guide
function escapeRx(aString) {
	return aString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// del me
module.exports = escapeRx;
