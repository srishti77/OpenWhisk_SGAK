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


function register(_ow, _context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    context = _context
}

function createAction(params) {    
    
    if (!props.validate()) {
        return;
    }

    if (vscode.window.activeTextEditor == undefined || vscode.window.activeTextEditor.document == undefined) {
        vscode.window.showWarningMessage('Must have a document open for editing.  The currently focused document will be used to create the OpenWhisk action.');
        return;
    }

    vscode.window.showInputBox({ placeHolder: 'Enter a name for your action:' })
        .then(function (action) {

            if (action == undefined) {
                return;
            }

            log.show(true);
            log.appendLine('\n$ openwsk action create ' + action);

            log.appendLine('Creating a new action using the currently open document: ' + vscode.window.activeTextEditor.document.uri);

            var options = {
                actionName: action,
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

            ow.actions.create(options)
                .then(function (result) {
                    log.appendLine('OpenWhisk action created: ' + util.formatQualifiedName(result));
                    vscode.window.showInformationMessage('OpenWhisk action created: ' + util.formatQualifiedName(result));
                })
                .catch(function (error) {
                    util.printOpenWhiskError(error);
                });
        });

}

module.exports = {
    register: register,
    createAction: createAction
};