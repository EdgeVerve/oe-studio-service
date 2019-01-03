/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */

var oecloud = require('oe-cloud');

oecloud.observe('loaded', function (ctx, next) {
  console.log("oe-cloud modules loaded");
    return next();
  })

  oecloud.boot(__dirname, function (err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    oecloud.start();
    oecloud.emit('test-start');
  });



var chalk = require('chalk');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-things'));
var defaults = require('superagent-defaults');
var supertest = require('supertest');
var basePath = oecloud.get('restApiRoot');

var designerMountPath = oecloud.get('designer').mountPath;
var api = defaults(supertest(oecloud));

var options;
var accessToken;
describe(chalk.blue('oe-studio-test'), function () {
  this.timeout(10000);

  it('t1 create user admin/admin with /default tenant', function (done) {
    var url = basePath + '/users';
    api.set('Accept', 'application/json')
    .post(url)
    .send([{ username: "admin", password: "admin", email: "admin@admin.com" }])
    .end(function (err, response) {
      var result = response.body;
      expect(result[0].id).to.be.defined;
      done();
    });
  });

  it('t2 Login with admin credentials', function (done) {
    var url = basePath + '/users/login';
    api.set('Accept', 'application/json')
    .post(url)
    .send({ username: "admin", password: "admin" })
    .end(function (err, response) {
      var result = response.body;
      accessToken = result.id;
      expect(accessToken).to.be.defined;
      done();
    });
  });

  xit('redirects to login page when not logged in', function (done) {
    var getUrl = designerMountPath;
    api.get(getUrl)
      .expect(302)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
  });


  it('returns designer index page', function (done) {
    var getUrl = designerMountPath;
    api.set('Authorization', accessToken)
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
  });

  it('Redirects to designer.mountPath when designer.html is requested', function (done) {
    var getUrl = '/designer.html';
    api.set('Authorization', accessToken)
      .get(getUrl)
      .expect(302)
      .end(function (err, result) {
      
        if (err) {
          done(err);
        } else {
          expect(result.header.location).to.exist;
          expect(result.header.location).to.equal(designerMountPath);
          
          done();
        }
      });
  });
  
  it('returns API endpoints for model', function (done) {
    var getUrl = designerMountPath + '/routes/DesignerElements';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.status).to.equal(200);
          expect(result.body).to.exist;
          expect(result.body).to.be.an('array');
          expect(result.body).all.to.satisfy(function(item){
            return (item.path && item.path.indexOf('/DesignerElements')===0);
          });
          done();
        }
      });
  });

  
  it('returns designer config', function (done) {
    var getUrl = designerMountPath + '/config';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('object');
          expect(result.body.mountPath).to.equal(designerMountPath);
          done();
        }
      });
  });

  it('returns template data', function (done) {
    var getUrl = designerMountPath + '/templates';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('array');
          expect(result.body).all.to.satisfy(function(item){
            return (item.file && item.path && item.content && item.type);
          });
          done();
        }
      });
  });

  it('returns style data', function (done) {
    var getUrl = designerMountPath + '/styles';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('array');
          expect(result.body).all.to.satisfy(function(item){
            return (item.file && item.path);
          });
          done();
        }
      });
  });

  
  it('returns assets data', function (done) {
    var getUrl = designerMountPath + '/assets';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('object');
          expect(result.body.images).to.be.ok;
          expect(result.body.videos).to.be.ok;
          expect(result.body.audios).to.be.ok;
          done();
        }
      });
  });

  it('returns images data', function (done) {
    var getUrl = designerMountPath + '/assets/images';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('array');
          expect(result.body).all.to.satisfy(function(item){
            return (item.file && item.path && item.size);
          });
          done();
        }
      });
  });

  it('returns video data', function (done) {
    var getUrl = designerMountPath + '/assets/videos';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('array');
          expect(result.body).all.to.satisfy(function(item){
            return (item.file && item.path && item.size);
          });
          done();
        }
      });
  });

  it('returns audio data', function (done) {
    var getUrl = designerMountPath + '/assets/audios';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('array');
          expect(result.body).all.to.satisfy(function(item){
            return (item.file && item.path && item.size);
          });
          done();
        }
      });
  });

  it('returns elements', function (done) {
    var getUrl = designerMountPath + '/elements';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body).to.be.an('array');
          expect(result.body).all.to.satisfy(function(item){
            return (item.name && item.tag && item.category && item.config && item.config.importUrl);
          });
          done();
        }
      });
  });

  it('save-file saves the file', function (done) {
    var postUrl = designerMountPath + '/save-file';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .post(postUrl)
      .send({file:"client/bower_components/test.html", data: "my-file-dummy-content"})
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body.status).to.be.true;
          done();
        }
      });
  });

  it('returns properties', function (done) {
    var getUrl = designerMountPath + '/properties/DesignerElements';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .get(getUrl)
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          console.log(result.body);
          expect(result.body).to.exist;
          expect(result.body.key).not.to.be.undefined;
          expect(result.body.key.type).to.be.equal('String');
          done();
        }
      });
  });

  it('error if model not present for default UI', function (done) {
    var postUrl = designerMountPath + '/createDefaultUI';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .post(postUrl)
      .send({ modelName: "TestUIModel" })
      .expect(500)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body.error.message).to.be.equal('Model not found');
          done();
        }
      });
  });

  it('create default UI', function (done) {
    var postUrl = designerMountPath + '/createDefaultUI';
    api.set('Authorization', accessToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .post(postUrl)
      .send({ modelName: "ModelDefinition" })
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.body).to.exist;
          expect(result.body.message).to.be.equal('Default UI created');
          api.set('Authorization', accessToken)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .post(postUrl)
            .send({ modelName: "ModelDefinition" })
            .expect(200)
            .end(function (err, result) {
              if (err) {
                done(err);
              } else {
                expect(result.body).to.exist;
                expect(result.body.message).to.be.equal('Default UI already exists');
                done();
              }
            });
        }
      });
  });

});
