'use strict';

var vscode = require('vscode');
let util = require('./util.js');
let helper = require('./helper.js');
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

function getTrigger(params) {

    if (!props.validate()) {
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select a trigger to fetch:' })
        .then(function (trigger) {

            if (trigger == undefined) {
                return;
            }

            var triggerString = trigger.toString();
            var startIndex = triggerString.indexOf('/');
            var namespace = triggerString.substring(0, startIndex);
            var triggerToGet = triggerString.substring(startIndex + 1);

            log.appendLine('\n$ openwsk trigger get ' + triggerToGet);

            var activityInterval = setInterval(function () {
                log.append('.');
            }, 300);

            var startTime = new Date().getTime();
            var invocationParams = {
                triggerName: triggerToGet,
                blocking: true,
                namespace: namespace
            }
            ow.triggers.get(invocationParams)
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
}

module.exports = {
    register: register,
    getTrigger: getTrigger
};