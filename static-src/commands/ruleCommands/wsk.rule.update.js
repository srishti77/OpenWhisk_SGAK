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

function getList() {
    return new Promise(function (fulfill, reject) {
        return ow.rules.list().then(function (rules) {
            fulfill(rules);
        }).catch(function (error) {
            log.appendLine(error.toString())
        });
    });
}

function getListAsStringArray() {
    return getList().then(function (rules) {
        var result = [];
        for (var x = 0; x < rules.length; x++) {
            var name = util.formatQualifiedName(rules[x]);
            result.push(name)
        }
        return result;
    })
}

function updateRule(params) {

    if (!props.validate()) {
        return;
    }

    var YES = 'Yes';
    var NO = 'No';

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select a rule to update:' })
        .then(function (rule) {

            if (rule == undefined) {
                return;
            }

            var parsedRule = util.parseQualifiedName(rule);
            rule = parsedRule.name;


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
                            log.appendLine(`\n$ wsk rule update ${rule} ${parsedTrigger.name} ${parsedAction.name}`);

                            vscode.window.showWarningMessage('Are you sure you want to overwrite ' + rule, YES, NO)
                                .then(function (selection) {
                                    if (selection === YES) {

                                        var activityInterval = setInterval(function () {
                                            log.append('.');
                                        }, 300);

                                        var startTime = new Date().getTime();
                                        var invocationParams = {
                                            ruleName: rule,
                                            trigger: parsedTrigger.name,
                                            action: parsedAction.name
                                        }

                                        ow.rules.update(invocationParams)
                                            .then(function (result) {
                                                var totalTime = startTime - (new Date().getTime());
                                                clearInterval(activityInterval);
                                                log.appendLine(JSON.stringify(result, null, 4))
                                                log.appendLine('>> completed in ' + (-totalTime) + 'ms');
                                            })
                                            .catch(function (error) {
                                                clearInterval(activityInterval);
                                                util.printOpenWhiskError(error);
                                            });
                                    } else {
                                        log.appendLine('cancelled by user')
                                    }
                                })
                        })
                })
        });
}

module.exports = {
    register: register,
    updateRule: updateRule
};