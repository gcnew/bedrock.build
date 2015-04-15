function mapValues(aObject, aMapper, aThis) {
	return Object.keys(aObject).reduce(function(aAcc, aKey) {
		aAcc[aKey] = aMapper.call(aThis, aObject[aKey]);
		return aAcc;
	}, {});
}

// del me
module.exports = mapValues;
