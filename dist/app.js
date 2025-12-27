(function () {
    'use strict';

    class AbstractView {
        constructor() {
            this.app = document.getElementById('root');
        }

        setTitle(title) {
            document.title = title;
        }

        render() {
            return
        }

        destroy() {
            return
        }
    }

    class BookDetailView extends AbstractView {
        constructor(appState) {
            super();
            this.appState = appState;
            this.setTitle('Описание книг');
        }

        render() {
            const main = document.createElement('div');
            main.innerHTML = `Описание книги`;
            this.app.innerHTML = '';
            this.app.append(main);
        }
    }

    class FavoritesView extends AbstractView {
        constructor() {
            super();
            this.setTitle('Избранные книг');
        }

        render() {
            const main = document.createElement('div');
            main.innerHTML = `Избранные книги`;
            this.app.innerHTML = '';
            this.app.append(main);
        }
    }

    const PATH_SEPARATOR = '.';
    const TARGET = Symbol('target');
    const UNSUBSCRIBE = Symbol('unsubscribe');

    function isBuiltinWithMutableMethods(value) {
    	return value instanceof Date
    		|| value instanceof Set
    		|| value instanceof Map
    		|| value instanceof WeakSet
    		|| value instanceof WeakMap
    		|| ArrayBuffer.isView(value);
    }

    function isBuiltinWithoutMutableMethods(value) {
    	// Primitives and null → true. Functions → false. RegExp → true.
    	return value === null
    		|| (typeof value !== 'object' && typeof value !== 'function')
    		|| value instanceof RegExp;
    }

    function isSymbol(value) {
    	return typeof value === 'symbol';
    }

    const path = {
    	after(path, subPath) {
    		if (Array.isArray(path)) {
    			return path.slice(subPath.length);
    		}

    		if (subPath === '') {
    			return path;
    		}

    		return path.slice(subPath.length + 1);
    	},
    	concat(path, key) {
    		if (Array.isArray(path)) {
    			path = [...path];

    			if (key) {
    				path.push(key);
    			}

    			return path;
    		}

    		if (key && key.toString !== undefined) {
    			if (path !== '') {
    				path += PATH_SEPARATOR;
    			}

    			if (isSymbol(key)) {
    				return path + key.toString();
    			}

    			return path + key;
    		}

    		return path;
    	},
    	initial(path) {
    		if (Array.isArray(path)) {
    			return path.slice(0, -1);
    		}

    		if (path === '') {
    			return path;
    		}

    		const index = path.lastIndexOf(PATH_SEPARATOR);

    		if (index === -1) {
    			return '';
    		}

    		return path.slice(0, index);
    	},
    	last(path) {
    		if (Array.isArray(path)) {
    			return path.at(-1) ?? '';
    		}

    		if (path === '') {
    			return path;
    		}

    		const index = path.lastIndexOf(PATH_SEPARATOR);

    		if (index === -1) {
    			return path;
    		}

    		return path.slice(index + 1);
    	},
    	walk(path, callback) {
    		if (Array.isArray(path)) {
    			for (const key of path) {
    				callback(key);
    			}
    		} else if (path !== '') {
    			let position = 0;
    			let index = path.indexOf(PATH_SEPARATOR);

    			if (index === -1) {
    				callback(path);
    			} else {
    				while (position < path.length) {
    					if (index === -1) {
    						index = path.length;
    					}

    					callback(path.slice(position, index));

    					position = index + 1;
    					index = path.indexOf(PATH_SEPARATOR, position);
    				}
    			}
    		}
    	},
    	get(object, path) {
    		this.walk(path, key => {
    			object &&= object[key];
    		});

    		return object;
    	},
    	isSubPath(path, subPath) {
    		if (Array.isArray(path)) {
    			if (path.length < subPath.length) {
    				return false;
    			}

    			// eslint-disable-next-line unicorn/no-for-loop
    			for (let i = 0; i < subPath.length; i++) {
    				if (path[i] !== subPath[i]) {
    					return false;
    				}
    			}

    			return true;
    		}

    		if (path.length < subPath.length) {
    			return false;
    		}

    		if (path === subPath) {
    			return true;
    		}

    		if (path.startsWith(subPath)) {
    			return path[subPath.length] === PATH_SEPARATOR;
    		}

    		return false;
    	},
    	isRootPath(path) {
    		if (Array.isArray(path)) {
    			return path.length === 0;
    		}

    		return path === '';
    	},
    };

    function isObject(value) {
    	return Object.prototype.toString.call(value) === '[object Object]';
    }

    function isIterator(value) {
    	return value !== null
    		&& typeof value === 'object'
    		&& typeof value.next === 'function';
    }

    /**
    Wraps an iterator's `next()` so yielded values (or [key, value] pairs) are passed through `prepareValue` with the correct owner and path.
    */
    // eslint-disable-next-line max-params
    function wrapIterator(iterator, target, thisArgument, applyPath, prepareValue) {
    	const originalNext = iterator?.next;
    	if (typeof originalNext !== 'function') {
    		return iterator;
    	}

    	if (target.name === 'entries') {
    		iterator.next = function () {
    			const result = originalNext.call(this);

    			if (result && result.done === false) {
    				result.value[0] = prepareValue(
    					result.value[0],
    					target,
    					result.value[0],
    					applyPath,
    				);
    				result.value[1] = prepareValue(
    					result.value[1],
    					target,
    					result.value[0],
    					applyPath,
    				);
    			}

    			return result;
    		};
    	} else if (target.name === 'values') {
    		const keyIterator = thisArgument[TARGET].keys();

    		iterator.next = function () {
    			const result = originalNext.call(this);

    			if (result && result.done === false) {
    				result.value = prepareValue(
    					result.value,
    					target,
    					keyIterator.next().value,
    					applyPath,
    				);
    			}

    			return result;
    		};
    	} else {
    		iterator.next = function () {
    			const result = originalNext.call(this);

    			if (result && result.done === false) {
    				result.value = prepareValue(
    					result.value,
    					target,
    					result.value,
    					applyPath,
    				);
    			}

    			return result;
    		};
    	}

    	return iterator;
    }

    function ignoreProperty(cache, options, property) {
    	if (cache.isUnsubscribed) {
    		return true;
    	}

    	if (options.ignoreSymbols && isSymbol(property)) {
    		return true;
    	}

    	// Only strings can be prefixed with "_"
    	if (options.ignoreUnderscores && typeof property === 'string' && property.charAt(0) === '_') {
    		return true;
    	}

    	const keys = options.ignoreKeys;
    	if (keys) {
    		return Array.isArray(keys) ? keys.includes(property) : (keys instanceof Set ? keys.has(property) : false);
    	}

    	return false;
    }

    /**
    @class Cache
    @private
    */
    class Cache {
    	constructor(equals) {
    		this._equals = equals;
    		this._proxyCache = new WeakMap();
    		this._pathCache = new WeakMap();
    		this._allPathsCache = new WeakMap();
    		this.isUnsubscribed = false;
    	}

    	_pathsEqual(pathA, pathB) {
    		if (!Array.isArray(pathA) || !Array.isArray(pathB)) {
    			return pathA === pathB;
    		}

    		return pathA.length === pathB.length
    			&& pathA.every((part, index) => part === pathB[index]);
    	}

    	_getDescriptorCache() {
    		if (this._descriptorCache === undefined) {
    			this._descriptorCache = new WeakMap();
    		}

    		return this._descriptorCache;
    	}

    	_getProperties(target) {
    		const descriptorCache = this._getDescriptorCache();
    		let properties = descriptorCache.get(target);

    		if (properties === undefined) {
    			properties = {};
    			descriptorCache.set(target, properties);
    		}

    		return properties;
    	}

    	_getOwnPropertyDescriptor(target, property) {
    		if (this.isUnsubscribed) {
    			return Reflect.getOwnPropertyDescriptor(target, property);
    		}

    		const properties = this._getProperties(target);
    		let descriptor = properties[property];

    		if (descriptor === undefined) {
    			descriptor = Reflect.getOwnPropertyDescriptor(target, property);
    			properties[property] = descriptor;
    		}

    		return descriptor;
    	}

    	getProxy(target, path, handler, proxyTarget) {
    		if (this.isUnsubscribed) {
    			return target;
    		}

    		const reflectTarget = proxyTarget === undefined ? undefined : target[proxyTarget];
    		const source = reflectTarget ?? target;

    		// Always set the primary path (for backward compatibility)
    		this._pathCache.set(source, path);

    		// Track all paths for this object
    		let allPaths = this._allPathsCache.get(source);
    		if (!allPaths) {
    			allPaths = [];
    			this._allPathsCache.set(source, allPaths);
    		}

    		// Add path if it doesn't already exist
    		const pathExists = allPaths.some(existingPath => this._pathsEqual(existingPath, path));
    		if (!pathExists) {
    			allPaths.push(path);
    		}

    		let proxy = this._proxyCache.get(source);

    		if (proxy === undefined) {
    			proxy = reflectTarget === undefined
    				? new Proxy(target, handler)
    				: target;

    			this._proxyCache.set(source, proxy);
    		}

    		return proxy;
    	}

    	getPath(target) {
    		return this.isUnsubscribed ? undefined : this._pathCache.get(target);
    	}

    	getAllPaths(target) {
    		if (this.isUnsubscribed) {
    			return undefined;
    		}

    		return this._allPathsCache.get(target);
    	}

    	isDetached(target, object) {
    		return !Object.is(target, path.get(object, this.getPath(target)));
    	}

    	defineProperty(target, property, descriptor) {
    		if (!Reflect.defineProperty(target, property, descriptor)) {
    			return false;
    		}

    		if (!this.isUnsubscribed) {
    			this._getProperties(target)[property] = descriptor;
    		}

    		return true;
    	}

    	setProperty(target, property, value, receiver, previous) { // eslint-disable-line max-params
    		if (!this._equals(previous, value) || !(property in target)) {
    			// Check if there's a setter anywhere in the prototype chain
    			let hasSetterInChain = false;
    			let current = target;
    			while (current) {
    				const descriptor = Reflect.getOwnPropertyDescriptor(current, property);

    				if (descriptor && 'set' in descriptor) {
    					hasSetterInChain = true;
    					break;
    				}

    				current = Object.getPrototypeOf(current);
    			}

    			if (hasSetterInChain) {
    				// Use receiver to ensure setter gets proxy as 'this'
    				return Reflect.set(target, property, value, receiver);
    			}

    			// For simple properties, don't use receiver to maintain existing behavior
    			return Reflect.set(target, property, value);
    		}

    		return true;
    	}

    	deleteProperty(target, property, previous) {
    		if (Reflect.deleteProperty(target, property)) {
    			if (!this.isUnsubscribed) {
    				const properties = this._getDescriptorCache().get(target);

    				if (properties) {
    					delete properties[property];
    					this._pathCache.delete(previous);
    				}
    			}

    			return true;
    		}

    		return false;
    	}

    	isSameDescriptor(a, target, property) {
    		const b = this._getOwnPropertyDescriptor(target, property);

    		return a !== undefined
    			&& b !== undefined
    			&& Object.is(a.value, b.value)
    			&& (a.writable || false) === (b.writable || false)
    			&& (a.enumerable || false) === (b.enumerable || false)
    			&& (a.configurable || false) === (b.configurable || false)
    			&& a.get === b.get
    			&& a.set === b.set;
    	}

    	isGetInvariant(target, property) {
    		const descriptor = this._getOwnPropertyDescriptor(target, property);

    		return descriptor !== undefined
    			&& descriptor.configurable !== true
    			&& descriptor.writable !== true;
    	}

    	unsubscribe() {
    		this._descriptorCache = null;
    		this._pathCache = null;
    		this._proxyCache = null;
    		this._allPathsCache = null;
    		this.isUnsubscribed = true;
    	}
    }

    var isArray = Array.isArray;

    function isDiffCertain() {
    	return true;
    }

    function isDiffArrays(clone, value) {
    	if (clone === value) {
    		return false;
    	}

    	return clone.length !== value.length
    		|| clone.some((item, index) => value[index] !== item);
    }

    const IMMUTABLE_OBJECT_METHODS = new Set([
    	'hasOwnProperty',
    	'isPrototypeOf',
    	'propertyIsEnumerable',
    	'toLocaleString',
    	'toString',
    	'valueOf',
    ]);

    const IMMUTABLE_ARRAY_METHODS = new Set([
    	'concat',
    	'includes',
    	'indexOf',
    	'join',
    	'keys',
    	'lastIndexOf',
    ]);

    const MUTABLE_ARRAY_METHODS = {
    	push: isDiffCertain,
    	pop: isDiffCertain,
    	shift: isDiffCertain,
    	unshift: isDiffCertain,
    	copyWithin: isDiffArrays,
    	reverse: isDiffArrays,
    	sort: isDiffArrays,
    	splice: isDiffArrays,
    	flat: isDiffArrays,
    	fill: isDiffArrays,
    };

    const HANDLED_ARRAY_METHODS = new Set([
    	...IMMUTABLE_OBJECT_METHODS,
    	...IMMUTABLE_ARRAY_METHODS,
    	...Object.keys(MUTABLE_ARRAY_METHODS),
    ]);

    function isDiffSets(clone, value) {
    	if (clone === value) {
    		return false;
    	}

    	if (clone.size !== value.size) {
    		return true;
    	}

    	for (const element of clone) {
    		if (!value.has(element)) {
    			return true;
    		}
    	}

    	return false;
    }

    const COLLECTION_ITERATOR_METHODS = [
    	'keys',
    	'values',
    	'entries',
    ];

    const IMMUTABLE_SET_METHODS = new Set([
    	'has',
    	'toString',
    ]);

    const MUTABLE_SET_METHODS = {
    	add: isDiffSets,
    	clear: isDiffSets,
    	delete: isDiffSets,
    	forEach: isDiffSets,
    };

    const HANDLED_SET_METHODS = new Set([
    	...IMMUTABLE_SET_METHODS,
    	...Object.keys(MUTABLE_SET_METHODS),
    	...COLLECTION_ITERATOR_METHODS,
    ]);

    function isDiffMaps(clone, value) {
    	if (clone === value) {
    		return false;
    	}

    	if (clone.size !== value.size) {
    		return true;
    	}

    	for (const [key, aValue] of clone) {
    		const bValue = value.get(key);
    		// Distinguish missing vs undefined and catch strict inequality
    		if (bValue !== aValue || (bValue === undefined && !value.has(key))) {
    			return true;
    		}
    	}

    	return false;
    }

    const IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS, 'get']);

    const MUTABLE_MAP_METHODS = {
    	set: isDiffMaps,
    	clear: isDiffMaps,
    	delete: isDiffMaps,
    	forEach: isDiffMaps,
    };

    const HANDLED_MAP_METHODS = new Set([
    	...IMMUTABLE_MAP_METHODS,
    	...Object.keys(MUTABLE_MAP_METHODS),
    	...COLLECTION_ITERATOR_METHODS,
    ]);

    class CloneObject {
    	constructor(value, path, argumentsList, hasOnValidate) {
    		this._path = path;
    		this._isChanged = false;
    		this._clonedCache = new Set();
    		this._hasOnValidate = hasOnValidate;
    		this._changes = hasOnValidate ? [] : null;

    		this.clone = path === undefined ? value : this._shallowClone(value);
    	}

    	static isHandledMethod(name) {
    		return IMMUTABLE_OBJECT_METHODS.has(name);
    	}

    	_shallowClone(value) {
    		let clone = value;

    		if (isObject(value)) {
    			clone = {...value};
    		} else if (isArray(value) || ArrayBuffer.isView(value)) {
    			clone = [...value];
    		} else if (value instanceof Date) {
    			clone = new Date(value);
    		} else if (value instanceof Set) {
    			clone = new Set([...value].map(item => this._shallowClone(item)));
    		} else if (value instanceof Map) {
    			clone = new Map();

    			for (const [key, item] of value.entries()) {
    				clone.set(key, this._shallowClone(item));
    			}
    		}

    		this._clonedCache.add(clone);

    		return clone;
    	}

    	preferredThisArg(isHandledMethod, name, thisArgument, thisProxyTarget) {
    		if (isHandledMethod) {
    			if (isArray(thisProxyTarget)) {
    				this._onIsChanged = MUTABLE_ARRAY_METHODS[name];
    			} else if (thisProxyTarget instanceof Set) {
    				this._onIsChanged = MUTABLE_SET_METHODS[name];
    			} else if (thisProxyTarget instanceof Map) {
    				this._onIsChanged = MUTABLE_MAP_METHODS[name];
    			}

    			return thisProxyTarget;
    		}

    		return thisArgument;
    	}

    	update(fullPath, property, value) {
    		const changePath = path.after(fullPath, this._path);

    		if (property !== 'length') {
    			let object = this.clone;

    			path.walk(changePath, key => {
    				if (object?.[key]) {
    					if (!this._clonedCache.has(object[key])) {
    						object[key] = this._shallowClone(object[key]);
    					}

    					object = object[key];
    				}
    			});

    			if (this._hasOnValidate) {
    				this._changes.push({
    					path: changePath,
    					property,
    					previous: value,
    				});
    			}

    			if (object?.[property]) {
    				object[property] = value;
    			}
    		}

    		this._isChanged = true;
    	}

    	undo(object) {
    		let change;

    		for (let index = this._changes.length - 1; index !== -1; index--) {
    			change = this._changes[index];

    			path.get(object, change.path)[change.property] = change.previous;
    		}
    	}

    	isChanged(value, _equals) {
    		return this._onIsChanged === undefined
    			? this._isChanged
    			: this._onIsChanged(this.clone, value);
    	}

    	isPathApplicable(changePath) {
    		return path.isRootPath(this._path) || path.isSubPath(changePath, this._path);
    	}
    }

    class CloneArray extends CloneObject {
    	static isHandledMethod(name) {
    		return HANDLED_ARRAY_METHODS.has(name);
    	}
    }

    class CloneDate extends CloneObject {
    	undo(object) {
    		object.setTime(this.clone.getTime());
    	}

    	isChanged(value, equals) {
    		return !equals(this.clone.valueOf(), value.valueOf());
    	}
    }

    class CloneSet extends CloneObject {
    	static isHandledMethod(name) {
    		return HANDLED_SET_METHODS.has(name);
    	}

    	undo(object) {
    		for (const value of this.clone) {
    			object.add(value);
    		}

    		for (const value of object) {
    			if (!this.clone.has(value)) {
    				object.delete(value);
    			}
    		}
    	}
    }

    class CloneMap extends CloneObject {
    	static isHandledMethod(name) {
    		return HANDLED_MAP_METHODS.has(name);
    	}

    	undo(object) {
    		for (const [key, value] of this.clone.entries()) {
    			object.set(key, value);
    		}

    		for (const key of object.keys()) {
    			if (!this.clone.has(key)) {
    				object.delete(key);
    			}
    		}
    	}
    }

    class CloneWeakSet extends CloneObject {
    	constructor(value, path, argumentsList, hasOnValidate) {
    		super(undefined, path, argumentsList, hasOnValidate);

    		this._argument1 = argumentsList[0];
    		this._weakValue = value.has(this._argument1);
    	}

    	isChanged(value, _equals) {
    		return this._weakValue !== value.has(this._argument1);
    	}

    	undo(object) {
    		if (this._weakValue && !object.has(this._argument1)) {
    			object.add(this._argument1);
    		} else {
    			object.delete(this._argument1);
    		}
    	}
    }

    class CloneWeakMap extends CloneObject {
    	constructor(value, path, argumentsList, hasOnValidate) {
    		super(undefined, path, argumentsList, hasOnValidate);

    		this._weakKey = argumentsList[0];
    		this._weakHas = value.has(this._weakKey);
    		this._weakValue = value.get(this._weakKey);
    	}

    	isChanged(value, _equals) {
    		return this._weakValue !== value.get(this._weakKey);
    	}

    	undo(object) {
    		const weakHas = object.has(this._weakKey);

    		if (this._weakHas && !weakHas) {
    			object.set(this._weakKey, this._weakValue);
    		} else if (!this._weakHas && weakHas) {
    			object.delete(this._weakKey);
    		} else if (this._weakValue !== object.get(this._weakKey)) {
    			object.set(this._weakKey, this._weakValue);
    		}
    	}
    }

    class SmartClone {
    	constructor(hasOnValidate) {
    		this._stack = [];
    		this._hasOnValidate = hasOnValidate;
    	}

    	static isHandledType(value) {
    		return isObject(value)
    			|| isArray(value)
    			|| isBuiltinWithMutableMethods(value);
    	}

    	static isHandledMethod(target, name) {
    		if (isObject(target)) {
    			return CloneObject.isHandledMethod(name);
    		}

    		if (isArray(target)) {
    			return CloneArray.isHandledMethod(name);
    		}

    		if (target instanceof Set) {
    			return CloneSet.isHandledMethod(name);
    		}

    		if (target instanceof Map) {
    			return CloneMap.isHandledMethod(name);
    		}

    		return isBuiltinWithMutableMethods(target);
    	}

    	get isCloning() {
    		return this._stack.length > 0;
    	}

    	start(value, path, argumentsList) {
    		let CloneClass = CloneObject;

    		if (isArray(value)) {
    			CloneClass = CloneArray;
    		} else if (value instanceof Date) {
    			CloneClass = CloneDate;
    		} else if (value instanceof Set) {
    			CloneClass = CloneSet;
    		} else if (value instanceof Map) {
    			CloneClass = CloneMap;
    		} else if (value instanceof WeakSet) {
    			CloneClass = CloneWeakSet;
    		} else if (value instanceof WeakMap) {
    			CloneClass = CloneWeakMap;
    		}

    		this._stack.push(new CloneClass(value, path, argumentsList, this._hasOnValidate));
    	}

    	update(fullPath, property, value) {
    		this._stack.at(-1).update(fullPath, property, value);
    	}

    	preferredThisArg(target, thisArgument, thisProxyTarget) {
    		const {name} = target;
    		const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, name);

    		return this._stack.at(-1)
    			.preferredThisArg(isHandledMethod, name, thisArgument, thisProxyTarget);
    	}

    	isChanged(value, equals) {
    		return this._stack.at(-1).isChanged(value, equals);
    	}

    	isPartOfClone(changePath) {
    		return this._stack.at(-1).isPathApplicable(changePath);
    	}

    	undo(object) {
    		if (this._previousClone !== undefined) {
    			this._previousClone.undo(object);
    		}
    	}

    	stop() {
    		this._previousClone = this._stack.pop();

    		return this._previousClone.clone;
    	}
    }

    /* eslint-disable unicorn/prefer-spread */

    // Constant set of iterator method names for efficient lookup
    const ITERATOR_METHOD_NAMES = new Set(['values', 'keys', 'entries']);

    // Constant set of array search methods for efficient lookup
    const ARRAY_SEARCH_METHODS = new Set(['indexOf', 'lastIndexOf', 'includes']);

    const defaultOptions = {
    	equals: Object.is,
    	isShallow: false,
    	pathAsArray: false,
    	ignoreSymbols: false,
    	ignoreUnderscores: false,
    	ignoreDetached: false,
    	details: false,
    };

    const shouldProvideApplyData = (details, methodName) => details === false
    	|| details === true
    	|| (Array.isArray(details) && details.includes(methodName));

    const onChange = (object, onChange, options = {}) => {
    	options = {
    		...defaultOptions,
    		...options,
    	};

    	const proxyTarget = Symbol('ProxyTarget');
    	const {equals, isShallow, ignoreDetached, details} = options;
    	const cache = new Cache(equals);
    	const hasOnValidate = typeof options.onValidate === 'function';
    	const smartClone = new SmartClone(hasOnValidate);

    	// eslint-disable-next-line max-params
    	const validate = (target, property, value, previous, applyData) => !hasOnValidate
    		|| smartClone.isCloning
    		|| options.onValidate(path.concat(cache.getPath(target), property), value, previous, applyData) === true;

    	// eslint-disable-next-line max-params
    	const handleChangeOnTarget = (target, property, value, previous, applyData) => {
    		if (
    			ignoreProperty(cache, options, property)
    			|| (ignoreDetached && cache.isDetached(target, object))
    		) {
    			return;
    		}

    		// Determine which paths to notify
    		const allPaths = cache.getAllPaths(target);
    		const pathsToNotify = !smartClone.isCloning && allPaths && allPaths.length > 1
    			? allPaths
    			: [cache.getPath(target)];

    		// Notify all relevant paths
    		for (const changePath of pathsToNotify) {
    			handleChange(changePath, property, value, previous, applyData);
    		}
    	};

    	// eslint-disable-next-line max-params
    	const handleChange = (changePath, property, value, previous, applyData) => {
    		if (smartClone.isCloning && smartClone.isPartOfClone(changePath)) {
    			smartClone.update(changePath, property, previous);
    		} else {
    			onChange(path.concat(changePath, property), value, previous, applyData);
    		}
    	};

    	const getProxyTarget = value =>
    		(value !== null && (typeof value === 'object' || typeof value === 'function'))
    			? (value[proxyTarget] ?? value)
    			: value;

    	const prepareValue = (value, target, property, basePath) => {
    		if (
    			isBuiltinWithoutMutableMethods(value)
    			|| property === 'constructor'
    			|| (isShallow && !SmartClone.isHandledMethod(target, property))
    			|| ignoreProperty(cache, options, property)
    			|| cache.isGetInvariant(target, property)
    			|| (ignoreDetached && cache.isDetached(target, object))
    		) {
    			return value;
    		}

    		if (basePath === undefined) {
    			basePath = cache.getPath(target);
    		}

    		/*
      		Check for circular references.

      		If the value already has a corresponding path/proxy,
    		and if the path corresponds to one of the parents,
    		then we are on a circular case, where the child is pointing to their parent.
    		In this case we return the proxy object with the shortest path.
      		*/
    		const childPath = path.concat(basePath, property);
    		const existingPath = cache.getPath(value);

    		if (existingPath && isSameObjectTree(childPath, existingPath)) {
    			// We are on the same object tree but deeper, so we use the parent path.
    			return cache.getProxy(value, existingPath, handler, proxyTarget);
    		}

    		return cache.getProxy(value, childPath, handler, proxyTarget);
    	};

    	/*
    	Returns true if `childPath` is a subpath of `existingPath`
    	(if childPath starts with existingPath). Otherwise, it returns false.

     	It also returns false if the 2 paths are identical.

     	For example:
    	- childPath    = group.layers.0.parent.layers.0.value
    	- existingPath = group.layers.0.parent
    	*/
    	const isSameObjectTree = (childPath, existingPath) => {
    		if (isSymbol(childPath) || childPath.length <= existingPath.length) {
    			return false;
    		}

    		if (Array.isArray(existingPath) && existingPath.length === 0) {
    			return false;
    		}

    		const childParts = Array.isArray(childPath) ? childPath : childPath.split(PATH_SEPARATOR);
    		const existingParts = Array.isArray(existingPath) ? existingPath : existingPath.split(PATH_SEPARATOR);

    		if (childParts.length <= existingParts.length) {
    			return false;
    		}

    		return !(existingParts.some((part, index) => part !== childParts[index]));
    	};

    	// Unified handler for SmartClone-based method execution
    	const handleMethodExecution = (target, thisArgument, thisProxyTarget, argumentsList) => {
    		// Standard SmartClone path for all handled types including Date
    		let applyPath = path.initial(cache.getPath(target));
    		const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, target.name);

    		smartClone.start(thisProxyTarget, applyPath, argumentsList);

    		let result;
    		// Special handling for array search methods that need proxy-aware comparison
    		if (Array.isArray(thisProxyTarget) && ARRAY_SEARCH_METHODS.has(target.name)) {
    			result = performProxyAwareArraySearch({
    				proxyArray: thisProxyTarget,
    				methodName: target.name,
    				searchElement: argumentsList[0],
    				fromIndex: argumentsList[1],
    				getProxyTarget,
    			});
    		} else {
    			result = Reflect.apply(
    				target,
    				smartClone.preferredThisArg(target, thisArgument, thisProxyTarget),
    				isHandledMethod
    					? argumentsList.map(argument => getProxyTarget(argument))
    					: argumentsList,
    			);
    		}

    		const isChanged = smartClone.isChanged(thisProxyTarget, equals);
    		const previous = smartClone.stop();

    		if (SmartClone.isHandledType(result) && isHandledMethod) {
    			if (thisArgument instanceof Map && target.name === 'get') {
    				applyPath = path.concat(applyPath, argumentsList[0]);
    			}

    			result = cache.getProxy(result, applyPath, handler);
    		}

    		if (isChanged) {
    			// Provide applyData based on details configuration
    			const applyData = shouldProvideApplyData(details, target.name)
    				? {
    					name: target.name,
    					args: argumentsList,
    					result,
    				}
    				: undefined;

    			const changePath = smartClone.isCloning
    				? path.initial(applyPath)
    				: applyPath;
    			const property = smartClone.isCloning
    				? path.last(applyPath)
    				: '';

    			if (validate(path.get(object, changePath), property, thisProxyTarget, previous, applyData)) {
    				handleChange(changePath, property, thisProxyTarget, previous, applyData);
    			} else {
    				smartClone.undo(thisProxyTarget);
    			}
    		}

    		if (
    			(thisArgument instanceof Map || thisArgument instanceof Set)
    			&& isIterator(result)
    		) {
    			return wrapIterator(result, target, thisArgument, applyPath, prepareValue);
    		}

    		return result;
    	};

    	const handler = {
    		get(target, property, receiver) {
    			if (isSymbol(property)) {
    				if (property === proxyTarget || property === TARGET) {
    					return target;
    				}

    				if (
    					property === UNSUBSCRIBE
    					&& !cache.isUnsubscribed
    					&& cache.getPath(target).length === 0
    				) {
    					cache.unsubscribe();
    					return target;
    				}
    			}

    			const value = isBuiltinWithMutableMethods(target)
    				? Reflect.get(target, property)
    				: Reflect.get(target, property, receiver);

    			return prepareValue(value, target, property);
    		},

    		set(target, property, value, receiver) {
    			value = getProxyTarget(value);

    			const reflectTarget = target[proxyTarget] ?? target;
    			const previous = reflectTarget[property];

    			if (equals(previous, value) && property in target) {
    				return true;
    			}

    			const isValid = validate(target, property, value, previous);

    			if (
    				isValid
    				&& cache.setProperty(reflectTarget, property, value, receiver, previous)
    			) {
    				handleChangeOnTarget(target, property, target[property], previous);

    				return true;
    			}

    			return !isValid;
    		},

    		defineProperty(target, property, descriptor) {
    			if (!cache.isSameDescriptor(descriptor, target, property)) {
    				const previous = target[property];

    				if (
    					validate(target, property, descriptor.value, previous)
    					&& cache.defineProperty(target, property, descriptor)
    				) {
    					// For accessor descriptors (getters/setters), descriptor.value is undefined
    					// We need to get the actual value after the property is defined
    					const hasValue = Object.hasOwn(descriptor, 'value');
    					const value = hasValue
    						? descriptor.value
    						: (() => {
    							try {
    								// Read the actual value through the getter
    								return target[property];
    							} catch {
    								// If the getter throws, use undefined
    								return undefined;
    							}
    						})();

    					handleChangeOnTarget(target, property, value, previous);
    				}
    			}

    			return true;
    		},

    		deleteProperty(target, property) {
    			if (!Reflect.has(target, property)) {
    				return true;
    			}

    			const previous = Reflect.get(target, property);
    			const isValid = validate(target, property, undefined, previous);

    			if (
    				isValid
    				&& cache.deleteProperty(target, property, previous)
    			) {
    				handleChangeOnTarget(target, property, undefined, previous);

    				return true;
    			}

    			return !isValid;
    		},

    		apply(target, thisArgument, argumentsList) {
    			// Handle case where thisArgument is undefined/null (e.g., extracted method calls)
    			const thisProxyTarget = thisArgument?.[proxyTarget] ?? thisArgument;

    			if (cache.isUnsubscribed) {
    				return Reflect.apply(target, thisProxyTarget, argumentsList);
    			}

    			// Check if SmartClone should be used for aggregate change tracking
    			if (SmartClone.isHandledType(thisProxyTarget)) {
    				// Skip SmartClone for custom methods on plain objects to enable property-level tracking
    				// Note: This approach doesn't support private fields (#field) which require the original instance
    				const isPlainObjectCustomMethod = isObject(thisProxyTarget)
    					&& !SmartClone.isHandledMethod(thisProxyTarget, target.name);

    				if (!isPlainObjectCustomMethod) {
    					// Use SmartClone for internal methods or based on details configuration
    					const isInternalMethod = typeof target.name === 'symbol'
    						|| ITERATOR_METHOD_NAMES.has(target.name);

    					const shouldUseSmartClone = isInternalMethod
    						|| details === false
    						|| (Array.isArray(details) && !details.includes(target.name));

    					if (shouldUseSmartClone) {
    						return handleMethodExecution(target, thisArgument, thisProxyTarget, argumentsList);
    					}
    				}
    			}

    			// Special handling for Date mutations when details option is used
    			// This allows tracking Date method calls with apply data
    			if (thisProxyTarget instanceof Date && SmartClone.isHandledMethod(thisProxyTarget, target.name)) {
    				const previousTime = thisProxyTarget.getTime();
    				const result = Reflect.apply(target, thisProxyTarget, argumentsList);
    				const currentTime = thisProxyTarget.getTime();

    				if (!equals(previousTime, currentTime)) {
    					const applyPath = cache.getPath(thisProxyTarget);

    					if (shouldProvideApplyData(details, target.name)) {
    						const applyData = {
    							name: target.name,
    							args: argumentsList,
    							result,
    						};
    						const previousDate = new Date(previousTime);

    						if (validate(path.get(object, applyPath), '', thisProxyTarget, previousDate, applyData)) {
    							handleChange(applyPath, '', thisProxyTarget, previousDate, applyData);
    						} else {
    							// Undo the change if validation fails
    							thisProxyTarget.setTime(previousTime);
    						}
    					}
    				}

    				return result;
    			}

    			// For plain object custom methods or when SmartClone is not used,
    			// use the proxy as 'this' to ensure property mutations go through proxy traps
    			return Reflect.apply(target, thisArgument, argumentsList);
    		},
    	};

    	const proxy = cache.getProxy(object, options.pathAsArray ? [] : '', handler);
    	onChange = onChange.bind(proxy);

    	if (hasOnValidate) {
    		options.onValidate = options.onValidate.bind(proxy);
    	}

    	return proxy;
    };

    // Helper function for array search methods that need proxy-aware comparison
    const performProxyAwareArraySearch = options => {
    	const {proxyArray, methodName, searchElement, fromIndex, getProxyTarget} = options;
    	const {length} = proxyArray;

    	if (length === 0) {
    		return methodName === 'includes' ? false : -1;
    	}

    	// Parse fromIndex according to ECMAScript specification
    	const isLastIndexOf = methodName === 'lastIndexOf';
    	let startIndex = fromIndex === undefined
    		? (isLastIndexOf ? length - 1 : 0)
    		: Math.trunc(Number(fromIndex)) || 0;

    	if (startIndex < 0) {
    		startIndex = Math.max(0, length + startIndex);
    	} else if (isLastIndexOf) {
    		startIndex = Math.min(startIndex, length - 1);
    	}

    	// Cache the search element's target for efficiency
    	const searchTarget = getProxyTarget(searchElement);

    	// Search with both proxy and target comparison
    	const searchBackward = methodName === 'lastIndexOf';
    	const endIndex = searchBackward ? -1 : length;
    	const step = searchBackward ? -1 : 1;

    	for (let index = startIndex; searchBackward ? index > endIndex : index < endIndex; index += step) {
    		const element = proxyArray[index];
    		if (element === searchElement || getProxyTarget(element) === searchTarget) {
    			return methodName === 'includes' ? true : index;
    		}
    	}

    	return methodName === 'includes' ? false : -1;
    };

    onChange.target = proxy => proxy?.[TARGET] ?? proxy;
    onChange.unsubscribe = proxy => proxy?.[UNSUBSCRIBE] ?? proxy;

    class MainView extends AbstractView {
        state = {
            list: [],
            loading: false,
            searchQuery: undefined,
            offset: 0,
        }

        constructor(appState) {
            super();
            this.appState = appState;
            this.appState = onChange(this.appState, this.appStateHook.bind(this));
            this.setTitle('Поиск книг');
        }

        appStateHook(path) {
            console.log(path);
            if (path === 'favorites') {
                console.log(path);
            }
        }

        render() {
            const main = document.createElement('div');
            main.innerHTML = `Число книг: ${this.appState.favorites.length}`;
            this.app.innerHTML = '';
            this.app.append(main);
            this.appState.favorites.push('fjngjdk');
        }
    }

    class App {
        routes = [
            {
                path: '',
                view: MainView,
            },
            {
                path: 'favorites',
                view: FavoritesView,
            },
            {
                path: `book`,
                view: BookDetailView,
            },
        ]

        appState = {
            favorites: [],
        }

        constructor() {
            window.addEventListener('hashchange', this.route.bind(this));
            this.route();
        }

        route() {
            if (this.currentView) {
                this.currentView.destroy();
            }
            let cleanPath = location.hash.replace(/^#/, '');
            const view = this.routes.find((r) => r.path === cleanPath).view;
            this.currentView = new view(this.appState);
            this.currentView.render();
        }
    }

    new App();

})();
