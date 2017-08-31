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

function patchConstructor(Target, patches) {
  function PatchedTarget() {
    patches.constructorMethod.apply(this, arguments);
    return new (Target.bind.apply(Target, arguments));
  }

  PatchedTarget.name = 'Patched' + Target.name

  PatchedTarget.prototype = Object.create(Target.prototype);

  objectAssign(PatchedTarget, Target);

  return PatchedTarget;
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
