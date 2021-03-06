# oe-studio-service
This is oeCloud working module that enables the usage of oe-studio in the application.

### Getting Started

To use this oe-studio feature in project from this module, you should install this module.

### Dependency
* oe-logger
* oe-cloud

### Testing and Code coverage

```sh
$ git clone https://github.com/EdgeVerve/oe-studio-service.git
$ cd oe-studio-service
$ npm install --no-optional
$ npm run grunt-cover
```

you can find coverage report in coverage folder.


### Installation

To use oe-studio-service in your application, you should include this module as a dependency to your app package.json as shown below.


```javascript
"oe-studio-service": "^2.0.0"
```

You can also install this mixin on command line using npm install.


```sh
$ npm install <git path oe-studio-service> --no-optional
```


### Attaching to Application

Once you have included this module in package.json, this module will get installed as part of npm install.TO use this in your app, you need to create entry in **app-list.json** file of application.

app-list.json

```javascript

  {
    "path": "oe-studio-service",
    "enabled": true
  }
```

### Bower dependency

To run the oe-studio-service you will need oe-studio bower component in your application under the `client/bower_components` path
You can install the bower component using the following command.

```sh
$ bower install oe-studio
```

### Setup

To allow serving of bower_components from client folder , the middleware.json of the application `files.static-serve` should be an array, as oe-studio adds the client directory for static serving.

## Configuration for designer in oe-cloud
User can provide designer configuration on server side in `config.json` using the property `designer`.

Currently supported designer config are as follows :

| Config Attribute | Description | Default Value |
|---|---|---|
| installationPath | Folder path for oe-studio | client/bower-components
| mountPath |  Route to navigate to studio | /designer |
| modules | Information on the plugins to be available in oe-studio | |



> Sample Config in `config.json`
```
...
...
"designer": {
   "installationPath": "client/bower_components",
   "mountPath": "/designer"
}
...
...
```

## Modules

The modules array provided in the `config.json` determines the plugins available to oe-studio. This array should contain objects similar to UIRoutes model data.
```
    [{
      'name': 'oe-model-manager',
      'path': '',
      'import': '/bower_components/oe-model-manager/oe-model-manager.html'
    },{
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
    }]

```
---

__Note : When no modules are specified by the application config , the above plugins will be available as defaults for the oe-studio.__

---

## License
The project is licensed under MIT License, See [LICENSE](./LICENSE) for more details.

## Contributing
We welcome contributions. Some of the best ways to contribute are to try things out, file bugs, and join in design conversations.

### [How to contribute](./CONTRIBUTION.md)
