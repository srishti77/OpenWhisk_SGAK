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


function deleteTrigger(params) {

    if (!props.validate()) {
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select a trigger to delete:' })
        .then(function (trigger) {

            if (trigger == undefined) {
                return;
            }

            var triggerString = trigger.toString();
            var startIndex = triggerString.indexOf('/');
            var namespace = triggerString.substring(0, startIndex);
            var triggerToDelete = triggerString.substring(startIndex + 1);

            log.show(true);
            log.appendLine('\n$ openwsk trigger delete ' + triggerToDelete);

            var options = {
                triggerName: triggerToDelete
            };

            var YES = 'Yes';
            var NO = 'No';

            vscode.window.showWarningMessage('Are you sure you want to delete ' + triggerToDelete, YES, NO)
                .then(function (selection) {
                    if (selection === YES) {
                        ow.triggers.delete(options)
                            .then(function (result) {
                                var message = 'OpenWhisk trigger deleted: ' + util.formatQualifiedName(result);
                                log.appendLine(message);
                                vscode.window.showInformationMessage(message);
                            })
                            .catch(function (error) {
                                util.printOpenWhiskError(error);
                            });
                    }
                });
        });
}

module.exports = {
    register: register,
    deleteTrigger: deleteTrigger
};