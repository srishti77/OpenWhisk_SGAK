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

function deleteAction(params) {

    if (!props.validate()) {
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select an action to delete:' })
        .then(function (action) {

            if (action == undefined) {
                return;
            }

            var actionString = action.toString();
            var startIndex = actionString.indexOf('/');
            var namespace = actionString.substring(0, startIndex);
            var actionToDelete = actionString.substring(startIndex + 1);

            log.show(true);
            log.appendLine('\n$ openwsk action delete ' + actionToDelete);

            var options = {
                actionName: actionToDelete
            };

            var YES = 'Yes';
            var NO = 'No';

            vscode.window.showWarningMessage('Are you sure you want to delete ' + actionToDelete, YES, NO)
                .then(function (selection) {
                    if (selection === YES) {
                        ow.actions.delete(options)
                            .then(function (result) {
                                console.log(result);
                                log.appendLine('OpenWhisk action deleted: ' + util.formatQualifiedName(result));
                                vscode.window.showInformationMessage('OpenWhisk action deleted: ' + util.formatQualifiedName(result));
                            })
                            .catch(function (error) {
                                util.printOpenWhiskError(error);
                            });
                    }
                });
        });
}

module.exports = {
    register: register,
    deleteAction: deleteAction
}