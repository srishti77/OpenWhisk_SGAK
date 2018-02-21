'use strict';

var vscode = require('vscode');
let util = require('./../util.js');
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
        return ow.triggers.list().then(function (triggers) {
            fulfill(triggers);
        }).catch(function (error) {
            log.appendLine(error.toString())
        });
    });
}

function getListAsStringArray() {
    return getList().then(function (triggers) {
        var result = [];
        for (var x = 0; x < triggers.length; x++) {
            var name = util.formatQualifiedName(triggers[x]);
            result.push(name)
        }
        return result;
    })
}

function fireTrigger(params) {

    if (!props.validate()) {
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select a trigger to fire:' })
        .then(function (trigger) {

            if (trigger == undefined) {
                return;
            }

            var triggerString = trigger.toString();
            var startIndex = triggerString.indexOf('/');
            var namespace = triggerString.substring(0, startIndex);
            var triggerToFire = triggerString.substring(startIndex + 1);

            vscode.window.showInputBox({
                placeHolder: 'Enter parameters (-p key value) or leave blank for no parameters:',
                value: ''
            }).then(function (parametersString) {

                var pString = ''
                if (parametersString != undefined) {
                    pString = parametersString
                }

                log.show(true);
                log.appendLine('\n$ openwsk trigger fire ' + trigger + ' ' + pString);

                var activityInterval = setInterval(function () {
                    log.append('.');
                }, 300);

                var startTime = new Date().getTime();
                var invocationParams = {
                    triggerName: triggerToFire,
                    blocking: true,
                    namespace: namespace
                }

                if (pString.length > 0) {
                    invocationParams.params = util.parseParametersString(pString);
                }
                ow.triggers.invoke(invocationParams)
                    .then(function (result) {
                        var totalTime = startTime - (new Date().getTime());
                        clearInterval(activityInterval);
                        log.appendLine(`\nok: triggered ${trigger}`);
                        log.appendLine(JSON.stringify(result, null, 4));
                        log.appendLine('>> completed in ' + (-totalTime) + 'ms');
                    })
                    .catch(function (error) {
                        clearInterval(activityInterval);
                        util.printOpenWhiskError(error);
                    });

            });
        });
}

module.exports = {
    register: register,
    fireTrigger: fireTrigger
};