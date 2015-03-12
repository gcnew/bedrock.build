function extend(aTartget /*, ..args */) {
	for (var i = 0; i < arguments.length; ++i) {
		var arg = arguments[i];

		for (var k in arg) {
			aTartget[k] = arg[k];
		}
	}

	return aTartget;
}

module.exports = extend;
