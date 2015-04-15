function concatMap(aArray, aMappper, aThis) {
	return Array.prototype.concat.apply([], aArray.map(aMappper, aThis));
}

// del me
module.exports = concatMap;
