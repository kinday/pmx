/**
 * Configuration object with patches
 * @typedef {Object} PatchesConfig
 * @property {?Function} constructorMethod
 * @property {Object.<string, ?Function>} prototypeMethods
 * @property {Object.<string, ?Function>} staticMethods
 */

function isFunction(fn) {
  return typeof fn === 'function'
}

/**
 * @author Thai Pangsakulyanont
 * @see {@link http://me.dt.in.th/page/JavaScript-override/}
 */
function before(extraBehavior) {
  return function (original) {
    return function () {
      extraBehavior.apply(this, arguments);
      return original.apply(this, arguments);
    }
  }
}

/**
 * @author Thai Pangsakulyanont
 * @see {@link http://me.dt.in.th/page/JavaScript-override/}
 */
function override(object, methodName, callback) {
  object[methodName] = callback(object[methodName]);
}

/**
 * Alter object’s name.
 * NodeJS behaviour is to append given name to initial object’s name.
 * @param {*} object
 * @param {string} name
 */
function renameObject(object, name) {
  var descriptor = Object.getOwnPropertyDescriptor(object, 'name')

  // Name property is not configurable in NodeJS earlier than 4
  if (descriptor.configurable) {
    Object.defineProperty(object, 'name', {
      configurable: true,
      value: name
    });
  }
}

/**
 * Call Object.getOwnPropertyDescriptors or fallback to polyfill
 * @param {*} object
 * @return {Object.<string, Object>}
 */
function getOwnPropertyDescriptors(object) {
  if (typeof Object.getOwnPropertyDescriptors === 'function') {
    return Object.getOwnPropertyDescriptors(object);
  }

  var descriptors = {};

  for (var name of Object.getOwnPropertyNames(object)) {
    descriptors[name] = Object.getOwnPropertyDescriptor(object, name);
  }

  return descriptors;
}

/**
 * Replace target object’s contructor preserving prototype and static methods.
 * @param {T} Target
 * @param {PatchesConfig} patches
 * @returns {T} Patched target
 * @template T
 */
function patchConstructor(Target, patches) {
  function Patched() {
    patches.constructorMethod.apply(this, arguments);
    // Bound all arguments to original constructor before instantiation
    // In ES2015 would look like `new Target(...arguments)`
    return new (Target.bind.apply(Target, arguments));
  }

  // Try altering name of patched object for easier debugging
  renameObject(Patched, Target.name)

  // Copy static properties
  Object.defineProperties(Patched, getOwnPropertyDescriptors(Target));

  // Copy prototype
  Patched.prototype = Object.create(Target.prototype);

  return Patched;
}

/**
 * Patch given object’s constructor, prototype or static methods to add extra
 * side-effects without altering original behaviour.
 * @param {T} Target
 * @param {PatchesConfig} patches
 * @returns {T}
 * @template T
 */
function patch(Target, patches) {
  if (patches) {
    if (isFunction(patches.constructorMethod)) {
      return patch(patchConstructor(Target, patches), {
        prototypeMethods: patches.prototypeMethods,
        staticMethods: patches.staticMethods
      });
    }

    if (patches.prototypeMethods) {
      for (var methodName in patches.prototypeMethods) {
        var extraBehavior = patches.prototypeMethods[methodName]
        if (isFunction(extraBehavior)) {
          override(
            Target.prototype,
            methodName,
            before(patches.prototypeMethods[methodName])
          );
        }
      }
    }

    if (patches.staticMethods) {
      for (var methodName in patches.staticMethods) {
        var extraBehavior = patches.staticMethods[methodName]
        if (isFunction(extraBehavior)) {
          override(
            Target,
            methodName,
            before(extraBehavior)
          );
        }
      }
    }
  }

  return Target;
}

module.exports = patch;