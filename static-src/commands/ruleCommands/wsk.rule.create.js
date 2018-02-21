'use strict';

var vscode = require('vscode');
let util = require('./../util.js');


let wskAction = require('./../wsk.action.js');
let wskTrigger = require('./../wsk.trigger.js');

let helper = require('./../helper.js');

var log;
var ow;
var props;

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
}

function getActionListAsStringArray() {
    return wskAction.getListAsStringArray()
}
function getTriggerListAsStringArray() {
    return wskTrigger.getListAsStringArray()
}

function createRule(params) {

    if (!props.validate()) {
        return;
    }

    var YES = 'Yes';
    var NO = 'No';

    vscode.window.showInputBox({ placeHolder: 'Enter a name for your rule:' })
        .then(function (rule) {

            if (rule == undefined) {
                return;
            }

            vscode.window.showQuickPick(getTriggerListAsStringArray(), { placeHolder: 'Select a trigger to bind:' })
                .then(function (trigger) {

                    if (trigger == undefined) {
                        return;
                    }


                    vscode.window.showQuickPick(getActionListAsStringArray(), { placeHolder: 'Select a action to bind:' })
                        .then(function (action) {

                            if (action == undefined) {
                                return;
                            }

                            var parsedTrigger = util.parseQualifiedName(trigger);
                            var parsedAction = util.parseQualifiedName(action);

                            log.show(true);
                            log.appendLine(`\n$ wsk rule create ${rule} ${parsedTrigger.name} ${parsedAction.name}`);

                            var activityInterval = setInterval(function () {
                                log.append('.');
                            }, 300);

                            var startTime = new Date().getTime();

                            // Problem with creating namespace - namespace not recognized
                            var invocationParams = {
                                ruleName: rule,                            
                                trigger: parsedTrigger.name,
                                action: parsedAction.name,
                                blocking: true,
                                namespace: namespace
                            }

                            ow.rules.create(invocationParams)
                                .then(function (result) {
                                    var totalTime = startTime - (new Date().getTime());
                                    clearInterval(activityInterval);
                                    log.appendLine(JSON.stringify(result, null, 4))
                                    log.appendLine('>> completed in ' + (-totalTime) + 'ms');


                                    vscode.window.showWarningMessage('Would you like to activate  ' + rule + '?', YES, NO)
                                        .then(function (selection) {
                                            if (selection === YES) {

                                                var qualifiedRule = props.get("namespace") + "/" + rule;

                                                doStatusChange(qualifiedRule, true);
                                            }
                                        });

                                })
                                .catch(function (error) {
                                    clearInterval(activityInterval);
                                    util.printOpenWhiskError(error);
                                });

                        })
                })
        });
}

module.exports = {
    register: register,
    createRule: createRule
};