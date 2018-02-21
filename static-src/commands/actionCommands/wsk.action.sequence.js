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

function getListAsStringArrayForSequenceDialog(firstCall) {
    return getListAsStringArray()
        .then(function (actions) {
            if (firstCall !== true) {
                actions.unshift(sequenceComplete)
            }
            return actions;
        })
}

function createSequenceAction(params) {

    if (!props.validate()) {
        return;
    }

    vscode.window.showInputBox({ placeHolder: 'Enter a name for your sequence:' })
        .then(function (action) {

            log.show(true);
            log.appendLine('\n$ openwsk action create ' + action);

            if (action == undefined) {
                return;
            }

            //first get the pipe action, so we can create the sequence action
            ow.actions.get({
                actionName: 'jay1',                   // needs initial action name
                blocking: true,                      // blocking remains true
                namespace: 'bonkilep@gmail.com_dev' // needs individual namespace

                // actionName: 'system/pipe',
                // blocking: true,
                // namespace: 'whisk.system'
            })
                .then(function (result) {

                    console.log(result);
                    var pipeCode = result.exec.code;

                    log.show(true);
                    log.appendLine('\n$ openwsk action create ' + action + ' --sequence');

                    var sequenceActions = [];

                    var selectSequenceActions = function (firstCall) {

                        vscode.window.showQuickPick(getListAsStringArrayForSequenceDialog(firstCall), { placeHolder: `Select action #${(sequenceActions.length + 1)} for the sequence.` })
                            .then(function (selectedActionStep) {

                                if (selectedActionStep == undefined) {
                                    log.appendLine('cancelled by user ESC');
                                    return;
                                }
                                else if (selectedActionStep != sequenceComplete) {

                                    sequenceActions.push('/' + selectedActionStep);
                                    selectSequenceActions(false);
                                }
                                else {
                                    //sequence complete
                                    if (sequenceActions.length > 0) {

                                        var options = {
                                            actionName: action,
                                            action: {
                                                exec: { kind: 'nodejs:6', code: pipeCode },
                                                parameters: [{
                                                    'key': '_actions',
                                                    'value': sequenceActions
                                                }]
                                            }
                                        };

                                        ow.actions.create(options)
                                            .then(function (result) {
                                                var message = 'OpenWhisk sequence created: ' + util.formatQualifiedName(result);
                                                log.appendLine(message);
                                                vscode.window.showInformationMessage(message);
                                            })
                                            .catch(function (error) {
                                                util.printOpenWhiskError(error);
                                            });
                                    }
                                }
                            });
                    }

                    selectSequenceActions(true);
                })
                .catch(function (error) {
                    util.printOpenWhiskError(error);
                });
        });
}

module.exports = {
    register: register,
    createSequenceAction: createSequenceAction
};