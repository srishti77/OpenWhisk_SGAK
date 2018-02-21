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
                log.appendLine("check");
                log.appendLine(error.toString());
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

function updateAction(params) {

    if (!props.validate()) {
        return;
    }

    if (vscode.window.activeTextEditor == undefined || vscode.window.activeTextEditor.document == undefined) {
        vscode.window.showWarningMessage('Must have a document open for editing.  The currently focused document will be used to create the OpenWhisk action.');
        return;
    }

    var YES = 'Yes';
    var NO = 'No';

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select an action to update:' })
        .then(function (action) {

            if (action == undefined) {
                return;
            }

            vscode.window.showWarningMessage('Are you sure you want to overwrite ' + action, YES, NO)
                .then(function (selection) {
                    if (selection === YES) {

                        var actionString = action.toString();
                        var startIndex = actionString.indexOf('/');
                        var namespace = actionString.substring(0, startIndex);
                        var actionToUpdate = actionString.substring(startIndex + 1);

                        log.show(true);
                        log.appendLine('\n$ openwsk action update ' + actionToUpdate);

                        log.appendLine('Updating action ' + actionToUpdate + ' using the currently open document: ' + vscode.window.activeTextEditor.document.uri);

                        var options = {
                            actionName: actionToUpdate,
                            action: vscode.window.activeTextEditor.document.getText()
                        };

                        var swiftExt = '.swift';
                        var pyExt = '.py';
                        var phpExt = '.php';
                        var lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(swiftExt);
                        if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - swiftExt.length) {
                            options.action = { exec: { kind: 'swift:3', code: options.action } }
                        } else {

                            lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(pyExt);
                            if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - pyExt.length) {
                                options.action = { exec: { kind: 'python:3', code: options.action } }
                            } else {
                                lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(phpExt);
                                if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - phpExt.length) {
                                    options.action = { exec: { kind: 'php:7.1', code: options.action } }
                                } else {
                                    options.action = { exec: { kind: 'nodejs:6', code: options.action } }
                                }
                            }
                        }

                        ow.actions.update(options)
                            .then(function (result) {
                                var message = 'OpenWhisk action updated: ' + util.formatQualifiedName(result)
                                log.appendLine(message);
                                vscode.window.showInformationMessage(message);
                            })
                            .catch(function (error) {
                                log.appendLine("Double-Check");
                                util.printOpenWhiskError(error);
                            });
                    }
                });
        });
}

module.exports = {
    register: register,
    updateAction: updateAction
};