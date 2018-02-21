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

function updateTrigger(params) {

    if (!props.validate()) {
        return;
    }

    var YES = 'Yes';
    var NO = 'No';

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select a trigger to update:' })
        .then(function (trigger) {

            if (trigger == undefined) {
                return;
            }



            var triggerString = trigger.toString();
            var startIndex = triggerString.indexOf('/');
            var namespace = triggerString.substring(0, startIndex);
            var triggerToUpdate = triggerString.substring(startIndex + 1);


            vscode.window.showInputBox({
                placeHolder: 'Enter parameters to bind (-p key value) or leave blank for no parameters:',
                value: ''
            }).then(function (parametersString) {

                var pString = ''
                if (parametersString != undefined) {
                    pString = parametersString
                }

                log.show(true);
                log.appendLine('\n$ openwsk trigger update ' + trigger + ' ' + pString);

                vscode.window.showWarningMessage('Are you sure you want to overwrite ' + trigger, YES, NO)
                    .then(function (selection) {
                        if (selection === YES) {

                            var activityInterval = setInterval(function () {
                                log.append('.');
                            }, 300);

                            var startTime = new Date().getTime();
                            var invocationParams = {
                                triggerName: triggerToUpdate,
                                blocking: true,
                                namespace: namespace
                            }

                            if (pString.length > 0) {
                                var params = util.parseParametersString(pString);
                                var paramsArray = [];

                                for (var key in params) {
                                    var object = {};
                                    object.key = key;
                                    object.value = params[key];
                                    paramsArray.push(object)
                                }

                                invocationParams.trigger = {
                                    "parameters": paramsArray
                                };
                            }
                            ow.triggers.update(invocationParams)
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
                    });

            });
        });
}

module.exports = {
    register: register,
    updateTrigger: updateTrigger
};