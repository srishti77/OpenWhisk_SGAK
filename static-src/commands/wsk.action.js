/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var vscode = require('vscode');
let util = require('./util.js');
let fs = require('fs');
let spawn = require('child_process').spawn;

let helper = require('./helper.js');
let ivAct = require('./actionCommands/wsk.action.invoke.js');
let crAct = require('./actionCommands/wsk.action.create.js');
let upAct = require('./actionCommands/wsk.action.update.js');
let sqAct = require('./actionCommands/wsk.action.sequence.js');
let dlAct = require('./actionCommands/wsk.action.delete.js');
let gtAct = require('./actionCommands/wsk.action.get.js');
let rsAct = require('./actionCommands/wsk.action.rest.js');
let inAct = require('./actionCommands/wsk.action.init.js');

var importDirectory = '/wsk-import/';

var log;
var ow;
var actions = [];
var props;
var context;

var task = 'OpenWhisk';

//supported OpenWhisk file formats
var NODE = 'JavaScript',
    NODE6 = 'JavaScript 6',
    PHP = 'PHP',
    PYTHON = 'Python',
    SWIFT = 'Swift';

var sequenceComplete = {
                description:'',
                detail:'Sequence Complete - select this option to complete the sequence.  No additional action will be added to the sequence.',
                label:'-- No Action --',
            }//'--- - Sequence Complete ---';

function register(_ow, _context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    context = _context


    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.action', defaultAction);
    var listDisposable = vscode.commands.registerCommand('extension.wsk.action.list', listAction);
    var invokeDisposable = vscode.commands.registerCommand('extension.wsk.action.invoke', invokeAction);
    var debugDisposable = vscode.commands.registerCommand('extension.wsk.action.debug', debugAction);
    var createDisposable = vscode.commands.registerCommand('extension.wsk.action.create', createAction);
    var updateDisposable = vscode.commands.registerCommand('extension.wsk.action.update', updateAction);
    var deleteDisposable = vscode.commands.registerCommand('extension.wsk.action.delete', deleteAction);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.action.get', getAction);
    var initDisposable = vscode.commands.registerCommand('extension.wsk.action.init', initAction);
    var restDisposable = vscode.commands.registerCommand('extension.wsk.action.rest', restAction);
    var createSequenceDisposable = vscode.commands.registerCommand('extension.wsk.action.sequence.create', createSequenceAction);
   
    context.subscriptions.push(listDisposable, invokeDisposable, debugDisposable, createDisposable, updateDisposable, deleteDisposable, getDisposable, initDisposable, createSequenceDisposable, restDisposable);
  
}

function defaultAction(params){
    helper.defaultAction('action'); 
}

function listAction(params) {
    if (!props.validate()){
        return;
    }

    log.show(true);  
    log.appendLine('\n$ openwsk action list');
    actionList();
}

function actionList() {
    var actList = getList();
    return actList
    .then(function (result) {

        util.appendHeading('actions');
        for (var x=0; x<result.length; x ++){
                util.appendEntry(result[x]);
        }

    })
    .catch(function(error) {
        util.printOpenWhiskError(error);
    });
}

function getList() {
    return new Promise(function (resolve, reject){
        return ow.actions.list()
        .then(function (_actions) {
            actions = _actions;
            resolve(actions);
        })
        .catch(function(error) {
            log.appendLine(error.toString())
        });
    });
}

function getListAsStringArray() {
    return getList()
    .then(function (actions) {
        var result = [];
        for (var x=0; x<actions.length; x ++){
            var actionName = util.formatQualifiedName(actions[x]);
            result.push(actionName)
        }
        return result;
    })
}


// corresponding functions for Action commands


function invokeAction(params) {
    ivAct.register(ow, context, log, props);
    ivAct.invokeAction(params);
}

function createAction(params) {
    crAct.register(ow, context, log, props);
    crAct.createAction(params);
}

function updateAction(params) {
    upAct.register(ow, context, log, props);
    upAct.updateAction(params);
}

function createSequenceAction(params) {
    sqAct.register(ow, context, log, props);
    sqAct.createSequenceAction(params);
}

function deleteAction(params) {
    dlAct.register(ow, context, log, props);
    dlAct.deleteAction(params);
}

function getAction(params) {
    gtAct.register(ow, context, log, props);
    gtAct.getAction(params);
}

function initAction(params) {
    inAct.register(ow, context, log, props);
    inAct.initAction(params);
}

function restAction(params) {
    rsAct.register(ow, context, log, props);
    rsAct.restAction(params);
}


// debugAction function needs work


var wskdb = undefined;
function debugAction(params) {

    if (!props.validate()) {
        return;
    }
    selectActionAndRequestParameters(function (namespace, actionToInvoke, parametersString) {

        wskdb = spawn('wskdb', []);
        wskdb.stdout.setEncoding('utf-8');
        wskdb.stdin.setEncoding('utf-8');

        wskdb.on('error', (error) => {
            console.error(error);
            log.appendLine("Unable to invoke the wskdb debugger.  Please make sure that you have it installed.");
        })

        wskdb.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            log.appendLine("ERROR:" + data.toString())
            wskdb.kill();
        });

        wskdb.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            wskdb = undefined;
        });

        var OK = /ok[\n|.*]*?\(wskdb\)/;
        var ERROR = /^Error\:/;

        var exit = function () {
            wskdb.stdout.removeAllListeners("data")
            wskdb.stdin.write("exit\n");
        }

        var attachDebugger = function () {
            log.appendLine('\n$ attaching wskdb to ' + actionToInvoke);

            wskdb.stdout.removeAllListeners("data")
            wskdb.stdin.write("attach " + actionToInvoke + "\n");

            var stdoutData;
            wskdb.stdout.on('data', (data) => {
                //console.log(`stdout: ${data}`);

                if (stdoutData == undefined) {
                    stdoutData = data;
                } else {
                    stdoutData += data;
                }

                var str = data.toString();
                if (stdoutData.match(OK)) {
                    invokeAction();
                } else if (stdoutData.match(ERROR)) {
                    log.appendLine(str);
                    exit();
                }
            });
        }

        var invokeAction = function () {

            log.appendLine('$ invoking wskdb with ' + actionToInvoke + ' ' + parametersString);
            wskdb.stdout.removeAllListeners("data")
            var stdinData = "invoke " + actionToInvoke + ' ' + parametersString;
            wskdb.stdin.write(stdinData + "\n");

            var stdoutData;
            var wroteOutput = false;

            wskdb.stdout.on('data', (data) => {
                //console.log(`stdout: ${data}`);

                var str = data.toString();

                if (stdoutData == undefined) {
                    stdoutData = data;
                } else {
                    stdoutData += data;
                }

                //clean garbage that sometimes gets shoved into stdout when writing to stdin
                if (stdoutData.indexOf(stdinData) >= 0) {
                    stdoutData = stdoutData.substring(stdoutData.indexOf(stdinData) + stdinData.length + 1)
                }

                //if contains a complete json doc, print it
                if (stdoutData.match(/{([^}]*)}/) && !wroteOutput) {
                    var outString = stdoutData.substring(stdoutData.indexOf("{"))
                    outString = outString.substring(0, outString.lastIndexOf("}") + 1);
                    log.appendLine(outString);
                    wroteOutput = true
                }

                if (stdoutData.match(OK)) {
                    exit();
                } else if (stdoutData.match(ERROR)) {
                    log.appendLine(str);
                    exit();
                }
            });
        }

        log.show(true);
        attachDebugger();

    });
}


module.exports = {
    register: register,
    actionList:actionList,
    task:task,
    getListAsStringArray:getListAsStringArray
};
