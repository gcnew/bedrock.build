function mapKeys(aObject, aMapper, aThis) {
	return Object.keys(aObject).reduce(function(aAcc, aKey) {
		aAcc[aMapper.call(aThis, aKey)] = aObject[aKey];
		return aAcc;
	}, {});
}

// del me
module.exports = mapKeys;
