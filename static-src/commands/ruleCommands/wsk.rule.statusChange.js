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

function doStatusChange(rule, enable) {
    if (!props.validate()) {
        return;
    }

    var statusChangeImpl = function (rule) {

        if (rule == undefined) {
            return;
        }

        var parsedRule = util.parseQualifiedName(rule)
        log.appendLine(`\n$ wsk rule ${enable ? 'enable' : 'disable'} ${parsedRule.name}`);

        var activityInterval = setInterval(function () {
            log.append('.');
        }, 300);

        var startTime = new Date().getTime();
        var invocationParams = {
            ruleName: parsedRule.name,
            blocking: true,
            namespace: parsedRule.namespace
        }

        var callback = function (result) {
            var totalTime = startTime - (new Date().getTime());
            clearInterval(activityInterval);
            log.appendLine(`ok: rule ${parsedRule.name} ${enable ? 'enabled' : 'disabled'}`)
            log.appendLine('>> completed in ' + (-totalTime) + 'ms');
        }
        var error = function (error) {
            clearInterval(activityInterval);
            util.printOpenWhiskError(error);
        }

        if (enable) {
            ow.rules.enable(invocationParams)
                .then(callback)
                .catch(error);
        } else {
            ow.rules.disable(invocationParams)
                .then(callback)
                .catch(error);
        }
    }

    if (rule == undefined) {
        //${enable?'enable'?'disable'}
        vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: `Select a rule to :` })
            .then(statusChangeImpl);
    } else {
        statusChangeImpl(rule)
    }

}

module.exports = {
    register: register,
    doStatusChange: doStatusChange
};