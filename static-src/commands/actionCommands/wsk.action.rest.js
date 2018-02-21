'use strict'

var vscode = require('vscode');
let util = require('./../util.js');
let fs = require('fs');
let spawn = require('child_process').spawn;

var importDirectory = '/wsk-import/';

var actions = [];
var ow;
var props;
var context;
let log = vscode.window.createOutputChannel("OpenWhisk");

var task = 'OpenWhisk';

//supported OpenWhisk file formats
var NODE = 'JavaScript',
    NODE6 = 'JavaScript 6',
    PHP = 'PHP',
    PYTHON = 'Python',
    SWIFT = 'Swift';

var sequenceComplete = {
    description: '',
    detail: 'Sequence Complete - select this option to complete the sequence.  No additional action will be added to the sequence.',
    label: '-- No Action --',
}//'--- - Sequence Complete ---';


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
                log.appendLine(error.toString())
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

function restAction(params) {

    if (!props.validate()) {
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), { placeHolder: 'Select an action to retrieve:' }).then(function (action) {

        if (action == undefined) {
            return;
        }

        var actionString = action.toString();
        var startIndex = actionString.indexOf('/');
        var namespace = actionString.substring(0, startIndex);
        var actionToGet = actionString.substring(startIndex + 1);

        log.show(true);
        log.appendLine('\n$ openwsk action get ' + actionToGet);

        var activityInterval = setInterval(function () {
            log.append('.');
        }, 300);


        var apiRoot = ow.actions.options.api
        var startTime = new Date().getTime();
        ow.actions.get({
            actionName: actionToGet,
            blocking: true,
            namespace: namespace
        }).then(function (result) {
            var totalTime = startTime - (new Date().getTime());;
            clearInterval(activityInterval);

            var hash = new Buffer(props.get('auth')).toString('base64')
            var parsedNamespace = util.parseQualifiedName(result.namespace)

            var restEndpoint = `curl -d '{ "arg": "value" }' '${props.host()}namespaces/${parsedNamespace.namespace}/actions/${parsedNamespace.name}/${result.name}?blocking=true' -X POST -H 'Authorization: Basic ${hash}' -H 'Content-Type: application/json'`;

            log.appendLine(`\nCURL REST invocation (You still need to set parameter key/value pairs):`);
            log.appendLine(`-------------------------------------------------------------------------`);
            log.appendLine(`\n${restEndpoint}`);
        })
            .catch(function (error) {
                util.printOpenWhiskError(error);
            });
    });
}

module.exports = {
    register: register,
    restAction: restAction
};