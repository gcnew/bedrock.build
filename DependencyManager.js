var extend = require('./extend');

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

		this.dependencies[path] = {
			path: path,
			source: aSource,
			name: aDirective.name,
			type: aDirective.type,
			dependencies: aDependencies
		};

		aDependencies
			.filter(this.isUnresolved, this)
			.forEach(function(aDependency) {
				this.unresolved[aDependency.path] = aDependency;
			}, this);

		// OK, all our dependencies are added for resolution
		delete this.unresolved[path];
	},

	setMainModule: function(aPath) {
		this.mainModule = this.dependencies[aPath];
	},

	nextUnresolved: function() {
		for (var retval in this.unresolved) {
			return this.unresolved[retval];
		}
	}
});

module.exports = DependencyManager;
