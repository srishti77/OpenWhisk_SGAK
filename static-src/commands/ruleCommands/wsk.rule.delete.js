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

function deleteRule(params) {

    if (!props.validate()) {
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select a rule to delete:' })
        .then(function (rule) {

            if (rule == undefined) {
                return;
            }

            var parsedRule = util.parseQualifiedName(rule)

            log.show(true);
            log.appendLine('\n$ wsk trigger delete ' + parsedRule.name);

            var options = {
                ruleName: parsedRule.name,
                namespace: parsedRule.namespace
            };

            var YES = 'Yes';
            var NO = 'No';

            vscode.window.showWarningMessage('Are you sure you want to delete ' + parsedRule.name, YES, NO)
                .then(function (selection) {
                    if (selection === YES) {
                        ow.rules.delete(options)
                            .then(function (result) {
                                var message = 'OpenWhisk rule deleted: ' + util.formatQualifiedName(result);
                                log.appendLine(message);
                                vscode.window.showInformationMessage(message);
                            })
                            .catch(function (error) {
                                log.appendLine('rule status must be \'inactive\' to delete');
                            });
                    }
                });
        });
}

module.exports = {
    register: register,
    deleteRule: deleteRule
};