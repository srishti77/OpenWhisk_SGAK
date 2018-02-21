'use strict'

var vscode = require('vscode');
let util = require('./../util.js');
let fs = require('fs');
let spawn = require('child_process').spawn;

var importDirectory = '/wsk-import/';

var actions = [];
var ow;
var props;
var context;
let log = vscode.window.createOutputChannel("OpenWhisk");

var task = 'OpenWhisk';

//supported OpenWhisk file formats
var NODE = 'JavaScript',
    NODE6 = 'JavaScript 6',
    PHP = 'PHP',
    PYTHON = 'Python',
    SWIFT = 'Swift';

var sequenceComplete = {
    description: '',
    detail: 'Sequence Complete - select this option to complete the sequence.  No additional action will be added to the sequence.',
    label: '-- No Action --',
}//'--- - Sequence Complete ---';


function register(_ow, _context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    context = _context
}

function initAction(params) {

    if (!hasValidProjectRoot()) {
        return;
    }

    vscode.window.showQuickPick([NODE, PHP, PYTHON, SWIFT], { placeHolder: 'Select the type of action:' })
        .then(function (action) {

            if (action == undefined) {
                return;
            }

            var fileN;
            vscode.window.showInputBox({ prompt: `Enter value for filename:` })
                .then(function (value) {

                    if (!value) {
                        return;
                    }
                    log.show(true);
                    log.appendLine(`$ Filename chosen: ${value}`);
                    fileN = value;

                    log.show(true);
                    log.appendLine('\n$ openwsk action init:' + action);

                    var templateName = action.toLowerCase()
                    templateName = templateName.replace(/\s/g, '');
                    templateName = context.extensionPath + "/static-src/templates/" + templateName + ".template"
                    var template = '';


                    var path = vscode.workspace.rootPath + importDirectory

                    fs.readFile(templateName, 'utf8', function (err, data) {
                        if (err) {
                            log.appendLine(err);
                            console.log(err)
                            return false;
                        }

                        template = data.toString()

                        //todo: make it look for unique names or prompt for name

                        var buffer = new Buffer(template);
                        var fileName = fileN;
                        var fileExt = '';
                        if (action == NODE || action == NODE6) {
                            fileExt += '.js'
                        } else if (action == PHP) {
                            fileExt += '.php'
                        } else if (action == PYTHON) {
                            fileExt += '.py'
                        } else {
                            fileExt += '.swift'
                        }

                        var path = vscode.workspace.rootPath + importDirectory

                        if (!fs.existsSync(path)) {
                            fs.mkdirSync(path);
                        }

                        var filePath = getUniqueFilename(path, fileName, fileExt);

                        fs.open(filePath, 'w', function (err, fd) {
                            if (err) {
                                throw 'error opening file: ' + err;
                            }

                            fs.write(fd, buffer, 0, buffer.length, null, function (err) {
                                if (err) throw 'error writing file: ' + err;
                                fs.close(fd, function () {
                                    //console.log('file written');

                                    vscode.workspace.openTextDocument(filePath)
                                        .then(function (document) {
                                            //console.log(document)
                                            vscode.window.showTextDocument(document);
                                            log.appendLine('Created new action using ' + action + ' template as ' + filePath);
                                        });

                                })
                            });
                        });

                    });
                });


        });
}

function hasValidProjectRoot() {
    if (vscode.workspace.rootPath == undefined) {
        var message = 'You must specify a project folder before you can import actions from OpenWhisk.  Please use the \'File\' menu, select \'Open\', then select a folder for your project.';

        log.show();
        log.appendLine(message);

        vscode.window.showWarningMessage(message)
        return false;
    }
    return true;
}

function getUniqueFilename(path, fileName, fileExt) {

    var unique = false;
    var attempt = 0;
    while (!unique) {
        var suffix = (attempt > 0) ? (attempt+1):"";
        var uniquePath = path + fileName + suffix + fileExt;

        //if file exists, updated attempt count and try again in the loop
        if (fs.existsSync(uniquePath)) {
            attempt++;
        }
        else {
            var unique = true;
            return uniquePath;
        }
    }
    return undefined;
}


module.exports = {
    register: register,
    initAction: initAction
}