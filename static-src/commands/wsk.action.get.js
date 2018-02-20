'use strict'

var vscode = require('vscode');
let util = require('./util.js');
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

function getList() {
    return new Promise(function (resolve, reject) {
        return ow.actions.list()
            .then(function (_actions) {
                actions = _actions;
                resolve(actions);
            })
            .catch(function (error) {
                log.appendLine(error.toString())
            });
    });
}

function getListAsStringArray() {
    return getList()
        .then(function (actions) {
            var result = [];
            for (var x = 0; x < actions.length; x++) {
                var actionName = util.formatQualifiedName(actions[x]);
                result.push(actionName)
            }
            return result;
        })
}

function getAction(params) {

    if (!props.validate()) {
        return;
    }

    if (!hasValidProjectRoot()) {
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select an action to retrieve:' }).then(function (action) {

        if (action == undefined) {
            return;
        }

        var actionString = action.toString();
        var startIndex = actionString.indexOf('/');
        var namespace = actionString.substring(0, startIndex);
        var actionToGet = actionString.substring(startIndex + 1);

        log.show(true);
        log.appendLine('\n$ openwsk action get ' + actionToGet);

        var activityInterval = setInterval(function () {
            log.append('.');
        }, 300);

        var startTime = new Date().getTime();
        ow.actions.get({
            actionName: actionToGet,
            blocking: true,
            namespace: namespace
        }).then(function (result) {
            var totalTime = startTime - (new Date().getTime());;
            clearInterval(activityInterval);
            log.appendLine('>> completed in ' + (-totalTime) + 'ms')

            if (isSequence(result)) {
                var message = actionToGet + ' is a sequence.  It cannot be edited directly, and has not be written to a file.';
                log.appendLine(message)
                vscode.window.showWarningMessage(message);
                log.appendLine('You can edit these individual sequence actions: ');
                for (var x = 0; x < result.parameters.length; x++) {
                    var param = result.parameters[x];
                    if (param.key == '_actions') {
                        for (var y = 0; y < param.value.length; y++) {
                            log.appendLine('  >  ' + param.value[y])
                        }
                    }
                }
            }
            else {
                log.appendLine(JSON.stringify(result, null, 4))
                //todo: check if file exists before writing
                //todo: make sure user has selected a directory to import into

                var buffer = new Buffer(result.exec.code);
                var fileName = result.name;

                var fileExt = '';
                if (result.exec.kind.toString().search('swift') >= 0) {
                    fileName += '.swift'
                } else if (result.exec.kind.toString().search('python') >= 0) {
                    fileName += '.py'
                } else {
                    fileName += '.js'
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
                                    vscode.window.showTextDocument(document);
                                    vscode.window.showInformationMessage('Successfully imported ' + importDirectory + fileName);
                                    log.appendLine('Successfully imported file to ' + filePath);
                                });

                        })
                    });
                });
            }
        })
            .catch(function (error) {
                util.printOpenWhiskError(error);
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

function isSequence(result) {
    if (result.parameters) {
        for (var x = 0; x < result.parameters.length; x++) {
            var param = result.parameters[x];
            if (param.key == '_actions') {
                return true;
            }
        }
    }
    return false;
}

function getUniqueFilename(path, fileName, fileExt) {

    var unique = false;
    var attempt = 0;
    while (!unique) {
        var suffix = (attempt > 0) ? (attempt + 1) : "";
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
    getAction: getAction
};