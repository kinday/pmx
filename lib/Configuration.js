
var debug     = require('debug')('axm:events');
var Transport = require('./utils/transport.js');
var Autocast  = require('./utils/autocast.js');
var path      = require('path');
var fs        = require('fs');
var util      = require('util');
var pkg       = require('../package.json');

var Configuration = {};

/**
 * Event axm:option:configuration caught in PM2 (it add it to the status configuration)
 */
Configuration.configureModule = function(opts) {
  Transport.send({
    type : 'axm:option:configuration',
    data : opts
  }, false);
};

function findPackageJson() {
  var pkg_path = path.resolve(path.dirname(require.main.filename), 'package.json');

  try {
    fs.statSync(pkg_path);
  } catch(e) {
    try {
      pkg_path = path.resolve(path.dirname(require.main.filename), '..', 'package.json');
      fs.statSync(pkg_path);
    } catch(e) {
      debug('Cannot find package.json');
      return null;
    }
    return pkg_path;
  }

  return pkg_path;
}

Configuration.initConf = function(conf, do_not_tell_pm2) {
  var package_filepath = findPackageJson();
  var package_json;

  if (!conf.module_conf)
    conf.module_conf = {};

  if (conf.__is_module == true) {
    /**
     * Merge package.json metadata
     */
    try {
      package_json = require(package_filepath);

      conf.module_version = package_json.version;
      conf.module_name    = package_json.name;
      conf.description    = package_json.description;
      conf.pmx_version    = null;

      if (pkg.version)
        conf.pmx_version    = pkg.version;

      if (package_json.config) {
        conf = util._extend(conf, package_json.config);
        conf.module_conf = package_json.config;
      }
    } catch(e) {
      debug(e);
    }
  } else {
    conf.module_name = process.env.name || 'outside-pm2';

    try {
      package_json = require(package_filepath);

      conf.module_version = package_json.version;
      conf.pmx_version    = null;

      if (pkg.version)
        conf.pmx_version    = pkg.version;

      if (package_json.config) {
        conf = util._extend(conf, package_json.config);
        conf.module_conf = package_json.config;
      }
    } catch(e) {
      debug(e);
    }
  }

  /**
   * If custom variables has been set, merge with returned configuration
   */
  try {
    if (process.env[conf.module_name]) {
      var casted_conf = Autocast(JSON.parse(process.env[conf.module_name]));
      conf = util._extend(conf, casted_conf);
      // Do not display probe configuration in Keymetrics
      delete casted_conf.probes;
      // This is the configuration variable modifiable from keymetrics
      conf.module_conf = JSON.parse(JSON.stringify(util._extend(conf.module_conf, casted_conf)));

      // Obfuscate passwords
      Object.keys(conf.module_conf).forEach(function(key) {
        if ((key == 'password' || key == 'passwd') &&
            conf.module_conf[key].length >= 1) {
          conf.module_conf[key] = 'Password hidden';
        }

      });
    }
  } catch(e) {
    debug(e);
  }

  if (do_not_tell_pm2 == true) return conf;

  Configuration.configureModule(conf);
  return conf;
};

Configuration.getPID = function(file) {
  if (typeof(file) === 'number')
    return file;
  return parseInt(fs.readFileSync(file).toString());
};

Configuration.resolvePidPaths = function(filepaths) {
  if (typeof(filepaths) === 'number')
    return filepaths;

  function detect(filepaths) {
    var content = '';

    filepaths.some(function(filepath) {
      try {
        content = fs.readFileSync(filepath);
      } catch(e) {
        return false;
      }
      return true;
    });

    return content.toString().trim();
  }

  var ret = parseInt(detect(filepaths));

  return isNaN(ret) ? null : ret;
};


module.exports = Configuration;
