function groupBy(aArray, aFunc, aThis) {
	return aArray.reduce(function(aAcc, aValue) {
		var key = aFunc.call(aThis, aValue);

		var group = aAcc[key] = aAcc[key] || [];
		group.push(aValue);

		return aAcc;
	}, {});
}
