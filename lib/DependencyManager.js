// import util/extend

var extend = require('./util/extend');

function DependencyManager() {
	this.dependencies = {};

	this.unresolved = {};
}

extend(DependencyManager.prototype, {
	isResolved: function(aDependency) {
		return !this.isUnresolved(aDependency);
	},

	isUnresolved: function(aDependency) {
		return !(aDependency.path in this.dependencies)
			|| (aDependency.path in this.unresolved);
	},

	add: function(aDirective, aSource, aDependencies) {
		var path = aDirective.path;

		if (this.dependencies[path]) {
			throw new Error('Dependency already added: ' + path);
		}

		this.dependencies[path] = extend({
			source: aSource,
			dependencies: aDependencies
		}, aDirective);

		aDependencies
			.filter(this.isUnresolved, this)
			.forEach(function(aDependency) {
				this.unresolved[aDependency.path] = extend({
					refs: []
				}, aDependency);
			}, this);

		aDependencies.forEach(function(aDependency) {
			var path = aDependency.path;
			var dep = this.dependencies[path] || this.unresolved[path];

			dep.refs.push(aDirective.path);
		}, this);

		// OK, all our dependencies are added for resolution
		delete this.unresolved[path];
	},

	nextUnresolved: function() {
		for (var retval in this.unresolved) {
			return this.unresolved[retval];
		}
	}
});

// del me
module.exports = DependencyManager;
