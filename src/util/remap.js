function remap(aObject, aMapper, aThis) {
	return Object.keys(aObject).reduce(function(aAcc, aKey) {
		var key_val = aMapper.call(aThis, aKey, aObject[aKey]);
		aAcc[key_val[0]] = aMapper[key_val[1]];

		return aAcc;
	}, {});
}
