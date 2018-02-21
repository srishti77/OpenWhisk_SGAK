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
    
function createTrigger(params) {
    if (!props.validate()) {
        return;
    }

    vscode.window.showInputBox({ placeHolder: 'Enter a name for your trigger:' })
    .then(function (trigger) {

        if (trigger == undefined) {
            return;
        }

        vscode.window.showInputBox({
            placeHolder: 'Enter parameters to bind (-p key value) or leave blank for no parameters:',
            value: ''
        }).then(function (parametersString) {

            var pString = ''
            if (parametersString != undefined) {
                pString = parametersString
            }

            log.show(true);
            log.appendLine('\n$ openwsk trigger create ' + trigger + ' ' + pString);

            var activityInterval = setInterval(function () {
                log.append('.');
            }, 300);


            var startTime = new Date().getTime();
            var invocationParams = {
                triggerName: trigger,
                blocking: true
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
            ow.triggers.create(invocationParams)
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
        });
    });
}

module.exports = {
    register: register,
    createTrigger: createTrigger
};