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

	get: function(aPathOrImport) {
		return this.dependencies[aPathOrImport.path || aPathOrImport];
	},

	getMain: function() {
		return this.get(this.get('.main').dependencies[0]);
	},

	setMain: function(aMain) {
		this.add({ path: '.main' }, null, [ aMain ]);
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

		// OK, all dependencies are added for resolution
		delete this.unresolved[path];
	},

	nextUnresolved: function() {
		for (var retval in this.unresolved) {
			return this.unresolved[retval];
		}
	},

	traverseDependencies: function(aVisitor) {
		var visited = {};

		var main = this.getMain();
		var stack = [
			{ file: main, idx: main.dependencies.length }
		];

		while (stack.length) {
			var peek = stack[stack.length - 1];

			if (!peek.idx) {
				visited[peek.file.path] = true;

				aVisitor(peek.file);
				stack.pop();

				continue;
			}

			var dep = this.get(peek.file.dependencies[--peek.idx]);
			if (visited[dep.path]) {
				continue;
			}

			stack.push(
				{ file: dep, idx: dep.dependencies.length }
			);
		}
	}
});

// del me
module.exports = DependencyManager;
