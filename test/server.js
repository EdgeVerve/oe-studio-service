var oecloud = require('oe-cloud');

oecloud.observe('loaded', function (ctx, next) {
  return next();
})

oecloud.boot(__dirname, function (err) {
  oecloud.start();
  oecloud.emit('test-start');
});

