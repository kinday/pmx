var objectAssign = require('object-assign');

function before(extraBehavior) {
  return function (original) {
    return function () {
      extraBehavior.apply(this, arguments);
      return original.apply(this, arguments);
    }
  }
}

function override(object, methodName, callback) {
  object[methodName] = callback(object[methodName]);
}

function renameObject(Target, name) {
  var descriptor = Object.getOwnPropertyDescriptor(Target, 'name')

  if (descriptor.configurable) {
    Object.defineProperty(Target, 'name', {
      configurable: true,
      value: name
    });
  }
}

function patchConstructor(Target, patches) {
  function Patched() {
    patches.constructorMethod.apply(this, arguments);
    return new (Target.bind.apply(Target, arguments));
  }

  renameObject(Patched, Target.name)

  Patched.prototype = Object.create(Target.prototype);

  objectAssign(Patched, Target);

  return Patched;
}

function patch(Target, patches) {
  if (patches.constructorMethod) {
    return patch(patchConstructor(Target, patches), {
      prototypeMethods: patches.prototypeMethods,
      staticMethods: patches.staticMethods
    });
  }

  if (patches.prototypeMethods) {
    for (var methodName in patches.prototypeMethods) {
      override(
        Target.prototype,
        methodName,
        before(patches.prototypeMethods[methodName])
      );
    }
  }

  if (patches.staticMethods) {
    for (var methodName in patches.staticMethods) {
      override(
        Target,
        methodName,
        before(patches.staticMethods[methodName])
      );
    }
  }

  return Target;
}

module.exports = patch;
