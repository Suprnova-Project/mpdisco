/*
 * jQuery File Upload Plugin Node.js Example 2.0.3
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2012, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, regexp: true, unparam: true, stupid: true */
/*global require, __dirname, unescape, console */

var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    util = require('util'),
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,

    formidable = require('formidable'),
    options,
    defaults = {
        tmpDir: __dirname + '/../tmp',
        publicDir: __dirname + '/../public',
        uploadDir: __dirname + '/../public/files',
        uploadUrl: '/files/',
        maxPostSize: 11000000000, // 11 GB
        minFileSize: 1,
        maxFileSize: 10000000000, // 10 GB
        acceptFileTypes: /.+/i,
        // Files not matched by this regular expression force a download dialog,
        // to prevent executing any scripts in the context of the service domain:
        safeFileTypes: /\.(gif|jpe?g|png)$/i,
        accessControl: {
            allowOrigin: '*',
            allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
            allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
        },
        uploadPath: function(filePath, callback) {
            callback(options.uploadDir);
        }
        /* Uncomment and edit this section to provide the service via HTTPS:
        ssl: {
            key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
            cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
        },
        */
    },
    utf8encode = function (str) {
        return unescape(encodeURIComponent(str));
    },
    nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/,
    nameCountFunc = function (s, index, ext) {
        return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
    },
    FileInfo = function (file) {
        this.name = file.name;
        this.size = file.size;
        this.type = file.type;
        this.delete_type = 'DELETE';
    },
    UploadHandler = function (req, res, callback) {
        this.req = req;
        this.res = res;
        this.callback = callback;
    };

FileInfo.prototype.validate = function () {
    if (options.minFileSize && options.minFileSize > this.size) {
        this.error = 'File is too small';
    } else if (options.maxFileSize && options.maxFileSize < this.size) {
        this.error = 'File is too big';
    } else if (!options.acceptFileTypes.test(this.name)) {
        this.error = 'Filetype not allowed';
    }
    return !this.error;
};
FileInfo.prototype.safeName = function () {
    // Prevent directory traversal and creating hidden system files:
    this.name = path.basename(this.name).replace(/^\.+/, '');
    // Prevent overwriting existing files:
    while (fs.existsSync(options.uploadDir + '/' + this.name)) {
        this.name = this.name.replace(nameCountRegexp, nameCountFunc);
    }
};
FileInfo.prototype.initUrls = function (req) {
    if (!this.error) {
        var baseUrl = (options.ssl ? 'https:' : 'http:') +
                '//' + req.headers.host + options.uploadUrl;
        this.url = this.delete_url = baseUrl + encodeURIComponent(this.name);
    }
};

UploadHandler.prototype.get = function () {
    var handler = this,
        files = [];
    fs.readdir(options.uploadDir, function (err, list) {
        list.forEach(function (name) {
            var stats = fs.statSync(options.uploadDir + '/' + name),
                fileInfo;
            if (stats.isFile() && name[0] !== '.') {
                fileInfo = new FileInfo({
                    name: name,
                    size: stats.size
                });
                fileInfo.initUrls(handler.req);
                files.push(fileInfo);
            }
        });
        handler.callback({files: files});
    });
};

UploadHandler.prototype.post = function () {
    var handler = this,
        form = new formidable.IncomingForm(),
        tmpFiles = [],
        files = [],
        map = {},
        counter = 1,
        redirect,
        finish = function () {
            counter -= 1;
            if (!counter) {
                files.forEach(function (fileInfo) {
                    fileInfo.initUrls(handler.req);
                });
                handler.callback({files: files}, redirect);
            }
        };
    form.uploadDir = options.tmpDir;
    form.on('fileBegin', function (name, file) {
        tmpFiles.push(file.path);
        var fileInfo = new FileInfo(file, handler.req, true);
        fileInfo.safeName();
        map[path.basename(file.path)] = fileInfo;
        files.push(fileInfo);
    })
    .on('field', function (name, value) {
        if (name === 'redirect') {
            redirect = value;
        }
    })
    .on('file', function (name, file) {
        var fileInfo = map[path.basename(file.path)];

        fileInfo.size = file.size;
        if (!fileInfo.validate()) {
            fs.unlink(file.path);
            return;
        }

        options.uploadPath(file.path, function(uploadPath) {

          mkdirp.sync(uploadPath);

          const dest = path.join(uploadPath, fileInfo.name);

          const readStream = fs.createReadStream(file.path);
          const writeStream = fs.createWriteStream(dest);

          readStream.pipe(writeStream);
          readStream.on('end', function () {
            fs.unlinkSync(file.path);
          });
        });
    })
    .on('aborted', function () {
        tmpFiles.forEach(function (file) {
            fs.unlink(file);
        });
    })
    .on('error', function (e) {
        console.log(e);
    })
    .on('progress', function (bytesReceived, bytesExpected) {
        if (bytesReceived > options.maxPostSize) {
            handler.req.connection.destroy();
        }
    })
    .on('end', finish).parse(handler.req);
};
UploadHandler.prototype.destroy = function () {
    var handler = this,
        fileName;
    if (handler.req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
        fileName = path.basename(decodeURIComponent(handler.req.url));
        if (fileName[0] !== '.') {
            fs.unlink(options.uploadDir + '/' + fileName, function (ex) {
                handler.callback({success: !ex});
            });
            return;
        }
    }
    handler.callback({success: false});
};

var FileUpload = function(opts) {

    options = _.defaults(opts, defaults);

    var events = new EventEmitter();

    var fn = function(req, res) {
        res.setHeader(
            'Access-Control-Allow-Origin',
            options.accessControl.allowOrigin
        );
        res.setHeader(
            'Access-Control-Allow-Methods',
            options.accessControl.allowMethods
        );
        res.setHeader(
            'Access-Control-Allow-Headers',
            options.accessControl.allowHeaders
        );

        var handleResult = function (result, redirect) {
            if (redirect) {
                res.writeHead(302, {
                    'Location': redirect.replace(
                        /%s/,
                        encodeURIComponent(JSON.stringify(result))
                    )
                });
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': req.headers.accept
                        .indexOf('application/json') !== -1 ?
                        'application/json' : 'text/plain'
                });
                res.end(JSON.stringify(result));
            }

            events.emit('end', result);
        }.bind(this);

        var setNoCacheHeaders = function () {
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('Content-Disposition', 'inline; filename="files.json"');
        };

        var handler = new UploadHandler(req, res, handleResult);

        switch (req.method) {
            case 'OPTIONS':
                res.end();
                break;
            case 'HEAD':
            case 'GET':
                if (req.url === '/') {
                    setNoCacheHeaders();
                    if (req.method === 'GET') {
                        handler.get();
                    } else {
                        res.end();
                    }
                } else {
                    fileServer.serve(req, res);
                }
                break;
            case 'POST':
                setNoCacheHeaders();
                handler.post();
                break;
            case 'DELETE':
                handler.destroy();
                break;
            default:
                res.statusCode = 405;
                res.end();
        }
    };

    _.extend(fn, {
        on: events.on.bind(events)
    });

    return fn;
};

FileUpload.defaults = defaults;

module.exports = FileUpload;
