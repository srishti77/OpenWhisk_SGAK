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

function getList() {
    return new Promise(function (resolve, reject) {
        return ow.actions.list()
            .then(function (_actions) {
                actions = _actions;
                resolve(actions);
            })
            .catch(function (error) {
                log.appendLine("check");
                log.appendLine(error.toString());
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

function invokeAction(params) {

    if (!props.validate()) {
        return;
    }

    selectActionAndRequestParameters(function (namespace, actionToInvoke, parametersString) {

        log.show(true);
        log.appendLine('\n$ openwsk action invoke ' + actionToInvoke + ' ' + parametersString);

        var activityInterval = setInterval(function () {
            log.append('.');
        }, 300);

        var startTime = new Date().getTime();
        var invocationParams = {
            actionName: actionToInvoke,
            blocking: true,
            namespace: namespace
        }

        if (parametersString.length > 0) {
            invocationParams.params = util.parseParametersString(parametersString);
        }
        ow.actions.invoke(invocationParams)
            .then(function (result) {
                var totalTime = startTime - (new Date().getTime());
                clearInterval(activityInterval);
                log.appendLine('\n' + JSON.stringify(result.response, null, 4));
                log.appendLine('>> completed in ' + (-totalTime) + 'ms');
            })
            .catch(function (error) {
                clearInterval(activityInterval);
                log.appendLine('\n$ whstttt openwsk action invoke ');
                util.printOpenWhiskError(error);
            });

    })
}


function selectActionAndRequestParameters(callback) {

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select an action.' })
        .then(function (action) {

            if (action == undefined) {
                return;
            }

            var actionString = action.toString();
            var startIndex = actionString.indexOf('/');
            var namespace = actionString.substring(0, startIndex);
            var actionToInvoke = actionString.substring(startIndex + 1);

            vscode.window.showInputBox({
                placeHolder: 'Enter parameters list (-p key value) or leave blank for no parameters:',
                value: props.get(actionToInvoke)
            })
                .then(function (parametersString) {

                    var pString = ''
                    if (parametersString != undefined) {
                        pString = parametersString
                    }

                    props.set(actionToInvoke, pString, true);

                    callback(namespace, actionToInvoke, parametersString)
                });
        });
}

module.exports = {
    register: register,
    invokeAction: invokeAction,
    selectActionAndRequestParameters: selectActionAndRequestParameters
};