/**
 *
 * �2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

/*   eslint-disable no-console */

var loopback = require('loopback');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var glob = require('glob');
var logger = require('oe-logger');
var log = logger('oe-studio');
var designerName = 'oe-studio';
var util = require('../../lib/utils');
var bodyParser = require('body-parser');

module.exports = function designerConfiguration(server, next) {
  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded({ extended: true }));

  var isStudioEnabled = server.get('enableDesigner');
  var designerConfig = server.get('designer') || {};

  function convertVerb(verb) {
    if (verb.toLowerCase() === 'all') {
      return 'POST';
    }

    if (verb.toLowerCase() === 'del') {
      return 'DELETE';
    }
    return verb.toUpperCase();
  }

  function ifDirectoryExist(dirname, cb) {
    fs.stat(dirname, function getDirectoryStats(err, stat) {
      var status = true;
      if (err) {
        status = false;
      }
      cb(dirname, status);
    });
  }

  function findAndCreate(modelName, data, options) {
    return new Promise(function (resolve, reject) {
      var model = loopback.findModel(modelName, options);
      model = model ? model : server.models[modelName];
      model.findOne({ where: data }, options, function (err, res) {
        if (err) {
          reject(err);
        } else if (!res) {
          model.create(data, options, function (err, res) {
            if (!err) {
              resolve(res);
            } else {
              reject(err);
            }
          });
        } else {
          resolve(true);
        }
      });
    });
  }


  function setDesignerPath(designerConfig, server) {
    var polymerVersion = (server.get('client') && server.get('client').polymerVersion === 3) ? 3 : 1;
    var DesignerPath = designerConfig.installationPath;
    if (!designerConfig.templatePath || designerConfig.templatePath.length === 0) {
      designerConfig.templatePath = [DesignerPath + '/' + designerName + '/templates'];
    }
    if (!designerConfig.stylePath || designerConfig.stylePath.length === 0) {
      designerConfig.stylePath = [DesignerPath + '/' + designerName + '/styles'];
    }
    if (!designerConfig.assetPath || designerConfig.assetPath.length === 0) {
      designerConfig.assetPath = ['client/images'];
    }

    var templatesData = [];
    var polymerRegex = (server.get('client') && server.get('client').polymerVersion === 3) ?  /\:componentName/ : /Polymer\s*\(/;
    designerConfig.templatePath.forEach(function templatePathForEach(tPath) {
      ifDirectoryExist(tPath, function ifDirectoryExistFn(dirName, status) {
        if (status) {
          var templateFiles = fs.readdirSync(dirName);
          templateFiles.forEach(function templateFilesForEach(fileName) {
            var tplRecord = templatesData.find(function (item) {
              return item.file === fileName;
            });

            if (!tplRecord) {
              tplRecord = {
                file: fileName,
                path: dirName,
                content: fs.readFileSync(dirName + '/' + fileName, {
                  encoding: 'utf-8'
                })
              };

              if (tplRecord.content && polymerRegex.test(tplRecord.content)) {
                if (tplRecord.content.indexOf(':modelAlias') >= 0) {
                  tplRecord.type = 'form';
                } else {
                  tplRecord.type = 'component';
                }
              } else {
                tplRecord.type = 'html';
              }
              templatesData.push(tplRecord);
            }
          });
        }
      });
    });
    module.templatesData = templatesData;

    var stylesData = [];
    designerConfig.stylePath.forEach(function stylePathForEach(sPath) {
      ifDirectoryExist(sPath, function ifDirectoryExistFn(dirName, status) {
        if (status) {
          var styleFiles = fs.readdirSync(dirName);
          styleFiles.forEach(function styleFilesForEach(fileName) {
            var styleRecord = {
              file: fileName,
              path: dirName
            };
            stylesData.push(styleRecord);
          });
        }
      });
    });
    module.stylesData = stylesData;

    var assetData = {
      images: [],
      videos: [],
      audios: []
    };

    var imageTypes = ['.JPG', '.JPEG', '.BMP', '.GIF', '.PNG', '.SVG'];
    var videoTypes = ['.MP4', '.MPEG', '.AVI', '.WMV', '.OGG', '.OGM', '.OGV', '.WEBM', '.3GP'];
    var audioTypes = ['.MP3', '.AAC', '.OGG', '.M4A'];
    designerConfig.assetPath.forEach(function assetPathForEach(aPath) {
      ifDirectoryExist(aPath, function ifDirectoryExist(dirName, status) {
        if (status) {
          var assetFiles = fs.readdirSync(dirName);
          assetFiles.forEach(function assetFilesForEach(fileName) {
            var stats = fs.statSync(path.join(dirName, fileName));
            if (stats.isFile()) {
              var assetRecord = {
                file: fileName,
                path: dirName,
                size: stats.size
              };
              var fileExtn = path.extname(fileName).toUpperCase();
              if (imageTypes.indexOf(fileExtn) >= 0) {
                assetData.images.push(assetRecord);
              } else if (videoTypes.indexOf(fileExtn) >= 0) {
                assetData.videos.push(assetRecord);
              } else if (audioTypes.indexOf(fileExtn) >= 0) {
                assetData.audios.push(assetRecord);
              }
            }
          });
        }
      });
    });
    module.assetData = assetData;

    var prospectElements = [];
    glob('client/**/*.html', function globFn(err, files) {
      if (!err && files && files.length > 0) {
        files.forEach(function filesForEach(file) {
          if (file.indexOf(designerName) < 0 && file.indexOf('/demo/') < 0 && file.indexOf('/test/') < 0) {
            fs.readFile(file, function read(err3, data) {
              var regexp = /<dom-module\s*id\s*=\s*["'](.*)["']\s*>/g;
              if (!err3) {
                var match = regexp.exec(data);
                if (match && match[1] && match[1] !== ':componentName') {
                  prospectElements.push({
                    name: match[1],
                    tag: match[1],
                    icon: 'icons:polymer',
                    description: match[1],
                    content: '<' + match[1] + '></' + match[1] + '>',
                    category: 'polymerElements',
                    config: {
                      domType: 'Polymer',
                      attributes: [],
                      importUrl: file.substr(6),
                      type: 'droppable'
                    },
                    previewImg: ''
                  });
                }
              }
            });
          }
        });
      }
    });
    module.prospectElements = prospectElements;

    // server.use(loopback.static(DesignerPath));
    server.get(designerConfig.mountPath, function sendResponse(req, res) {
      var subPath = server.get('subPath');
      if (subPath) {
        var studioIndexFile = fs.readFileSync(path.join(DesignerPath + '/' + designerName + '/index.html'), 'utf8');
        studioIndexFile = studioIndexFile.replace('/designer/config', '/' + subPath + '/designer/config');
        res.setHeader('content-type', 'text/HTML');
        res.send(studioIndexFile);
      } else {
        res.sendFile('index.html', {
          root: DesignerPath + '/' + designerName
        });
      }
    });


    // get properties of model
    server.get(designerConfig.mountPath + '/properties/:model', function designerRoutes(req, res) {
      var model = req.params.model;
      var baseModel = util.checkModelWithPlural(req.app, model);
      var actualModel = loopback.findModel(baseModel, req.callContext);
      actualModel = actualModel ? actualModel : server.models[baseModel];
      var r = {};
      for (var p in actualModel.definition.properties) {
        if (actualModel.definition.properties.hasOwnProperty(p)) {
          r[p] = Object.assign({}, actualModel.definition.properties[p]);
          r[p].type = (actualModel.definition.properties[p] && actualModel.definition.properties[p].type && actualModel.definition.properties[p].type.name) || 'object';
        }
      }
      return res.json(r);
    });


    server.get(designerConfig.mountPath + '/routes/:model', function designerRoutes(req, res) {
      var model = req.params.model;
      var remotes = server.remotes();
      var adapter = remotes.handler('rest').adapter;
      var routes = adapter.allRoutes();
      var classes = remotes.classes();
      routes = routes.map(function routesMapFn(route) {
        if (!route.documented) {
          return;
        }

        // Get the class definition matching this route.
        var className = route.method.split('.')[0];
        var classDef = classes.filter(function clasesFilter(item) {
          return item.name === className;
        })[0];

        if (!classDef) {
          log.error('Route exists with no class: %j', route);
          return;
        }
        var accepts = route.accepts || [];
        var method = route.method || [];
        var split = route.method.split('.');
        /* HACK */
        if (classDef && classDef.sharedCtor &&
          classDef.sharedCtor.accepts && split.length > 2) {
          accepts = accepts.concat(classDef.sharedCtor.accepts);
          if (classDef.sharedCtor.method) {
            method = method.concat(classDef.sharedCtor.method);
          }
        }

        // Filter out parameters that are generated from the incoming request,
        // or generated by functions that use those resources.
        accepts = accepts.filter(function acceptsFilter(arg) {
          if (!arg.http) {
            return true;
          }
          // Don't show derived arguments.
          if (typeof arg.http === 'function') {
            return false;
          }
          // Don't show arguments set to the incoming http request.
          // Please note that body needs to be shown, such as User.create().
          if (arg.http.source === 'req' ||
            arg.http.source === 'res' ||
            arg.http.source === 'context') {
            return false;
          }
          return true;
        });
        route.accepts = accepts;
        route.verb = convertVerb(route.verb);
        var methodSplitLength = route.method.split('.').length;
        if (methodSplitLength >= 1) {
          route.method = method.split('.')[methodSplitLength - 1];
        } else {
          route.method = method;
        }
        return {
          path: route.path,
          type: route.verb,
          description: route.description,
          accepts: route.accepts,
          method: route.method
        };
      });
      var modelEndPoints = _.groupBy(routes, function modelEndPoints(d) {
        return d.path.split('/')[1];
      });
      var baseModel = util.checkModelWithPlural(req.app, model);
      var actualModel = loopback.findModel(baseModel, req.callContext);
      actualModel = actualModel ? actualModel : server.models[baseModel];
      var result = actualModel ? modelEndPoints[actualModel.pluralModelName] : modelEndPoints;
      res.send(result);
    });

    server.get('/designer.html', function sendDesignerHomePage(req, res) {
      res.redirect(designerConfig.mountPath);
    });

    server.get(designerConfig.mountPath + '/config', function designerConfigurations(req, res) {
      res.json(designerConfig);
    });

    server.get(designerConfig.mountPath + '/templates', function designerTemplates(req, res) {
      res.json(module.templatesData);
    });

    server.get(designerConfig.mountPath + '/styles', function designerStyles(req, res) {
      res.json(module.stylesData);
    });

    server.post(designerConfig.mountPath + '/save-theme', function saveTheme(req, res) {
      fs.writeFile('client/styles/app-theme.html', req.body.data, function writeFileCbFn(err) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({
            status: true
          });
        }
      });
    });


    server.post(designerConfig.mountPath + '/save-file', function saveFile(req, res) {
      fs.writeFile(req.body.file, req.body.data, function writeFileCbFn(err) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({
            status: true
          });
        }
      });
    });


    // api to create default UI for model using default-form template and adding it to NavigationLink.
    server.post(designerConfig.mountPath + '/createDefaultUI', function (req, res) {
      var options = req.callContext;
      var modelName = req.body ? req.body.modelName : null;
      var err;

      if (!modelName) {
        err = new Error();
        err.error = {
          message: 'Please provide model name'
        };
        return res.status(500).send(err);
      }

      var model = loopback.findModel(modelName, options);
      model = model ? model : server.models[modelName];
      if (!model) {
        err = new Error();
        err.error = {
          message: 'Model not found'
        };
        return res.status(500).send(err);
      }

      var modelNameLowerCase = req.body.modelName.toLowerCase();
      var templateExtension = (polymerVersion === 3) ? '.js' : '.html';


      var uiRouteData = {
        type: 'elem',
        name: modelNameLowerCase + '-default',
        path: '/' + modelNameLowerCase + '-default',
        import: designerConfig.restApiRoot + '/UIComponents/component/' + modelNameLowerCase + '-default' + templateExtension
      };

      var uiComponentData = {
        name: modelNameLowerCase + '-default',
        templateName: 'default-form' + templateExtension,
        modelName: modelName
      };

      var navigationLinkData = {
        name: modelNameLowerCase + '-default',
        url: '/' + modelNameLowerCase + '-default',
        label: modelName,
        group: 'root'
      };

      var arr = [];
      arr.push(findAndCreate('UIRoute', uiRouteData, options));
      arr.push(findAndCreate('UIComponent', uiComponentData, options));
      arr.push(findAndCreate('NavigationLink', navigationLinkData, options));

      Promise.all(arr).then(function (result) {
        if (new Set(result).size === 1) {
          res.json({ message: 'Default UI already exists' });
        } else {
          res.json({ message: 'Default UI created' });
        }
      }).catch(function (err) {
        res.status(500).send(err);
      });
    });

    server.get(designerConfig.mountPath + '/assets', function designerStyles(req, res) {
      res.json(module.assetData);
    });

    server.get(designerConfig.mountPath + '/assets/images', function designerStyles(req, res) {
      res.json(module.assetData.images);
    });

    server.get(designerConfig.mountPath + '/assets/videos', function designerStyles(req, res) {
      res.json(module.assetData.videos);
    });

    server.get(designerConfig.mountPath + '/assets/audios', function designerStyles(req, res) {
      res.json(module.assetData.audios);
    });

    server.get(designerConfig.mountPath + '/elements', function prospectElements(req, res) {
      res.json(module.prospectElements);
    });

    ifDirectoryExist(DesignerPath + '/' + designerName, function checkIfDirectoryExist(dirname, status) {
      if (status) {
        server.once('started', function DesignerServerStarted() {
          var baseUrl = server.get('url').replace(/\/$/, '');
          log.info('Browse Designer at %s%s', baseUrl, designerConfig.mountPath);
          console.log('Browse Designer at %s%s', baseUrl, designerConfig.mountPath);
        });
      }
      next();
    });
  }

  if (isStudioEnabled) {
    log.info('Designer enabled from config');
    var defaultConfig = {
      installationPath: (designerConfig.studioVersion === 3) ? 'client/node_modules' : 'client/bower_components',
      mountPath: '/designer',
      templatePath: [],
      stylePath: []
    };

    var _defaultModules = [{
      'name': 'oe-model-manager',
      'path': '',
      'import': '/bower_components/oe-model-manager/oe-model-manager.html'
    }, {
      'name': 'workflow-designer',
      'path': 'workflow-designer',
      'import': '/bower_components/oe-workflow-modeler/workflow-designer.html'
    }, {
      'name': 'oe-feel-designer',
      'path': 'rule-manager',
      'import': '/bower_components/oe-feel-designer/oe-feel-designer.html'
    }, {
      'name': 'oe-component-manager',
      'path': 'component-manager',
      'import': '/bower_components/oe-component-manager/oe-component-manager.html'
    }];

    var _defaultModules2 = [{
      'name': 'oe-component-manager',
      'path': '',
      'import': '/node_modules/oe-component-manager/oe-component-manager.js'
    }];

    var modules = designerConfig.modules || [];
    if (modules.length === 0) {
      designerConfig.modules = (designerConfig.studioVersion === 3) ? _defaultModules2 : _defaultModules;
    }

    designerConfig.restApiRoot = designerConfig.restApiRoot || server.get('restApiRoot');
    designerConfig.subPath = designerConfig.subPath || server.get('subPath');

    designerConfig = Object.assign({}, defaultConfig, designerConfig || {});
    if (designerConfig.subPath) {
      designerConfig.modules.forEach(function (item) {
        item.import = designerConfig.subPath + item.import;
      });
    }

    ifDirectoryExist(designerConfig.installationPath + '/' + designerName, function directorySearch(dirname, status) {
      if (status) {
        setDesignerPath(designerConfig, server);
      } else {
        log.warn('Designer not installed at [' + designerConfig.installationPath + '/' + designerName + ']');
        console.warn('Designer not installed at [' + designerConfig.installationPath + '/' + designerName + ']');
        next();
      }
    });
  } else {
    next();
  }
};
