function partition(aArray, aPredicate, aThis) {
	return aArray.reduce(function(aAcc, aX) {
		aAcc[+!aPredicate.call(aThis, aX)].push(aX);

		return aAcc;
	}, [ [], [] ]);
}

// del me
module.exports = partition;
