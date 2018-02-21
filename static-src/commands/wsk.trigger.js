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
let helper = require('./helper.js');
let crTrgg = require('./triggerCommands/wsk.trigger.create.js');
let upTrgg = require('./triggerCommands/wsk.trigger.update.js');
let dlTrgg = require('./triggerCommands/wsk.trigger.delete.js');
let gtTrgg = require('./triggerCommands/wsk.trigger.get.js');
let frTrgg = require('./triggerCommands/wsk.trigger.fire.js');

var log;
var ow;
var props;
var context;

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    context = context;

    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.trigger', defaultAction);
    var listDisposable = vscode.commands.registerCommand('extension.wsk.trigger.list', listTrigger);
    var createDisposable = vscode.commands.registerCommand('extension.wsk.trigger.create', createTrigger);
    var updateDisposable = vscode.commands.registerCommand('extension.wsk.trigger.update', updateTrigger);
    var deleteDisposable = vscode.commands.registerCommand('extension.wsk.trigger.delete', deleteTrigger);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.trigger.get', getTrigger);
    var fireDisposable = vscode.commands.registerCommand('extension.wsk.trigger.fire', fireTrigger);



    context.subscriptions.push(defaultDisposable, listDisposable, createDisposable, updateDisposable, deleteDisposable, getDisposable, fireDisposable);
}


function defaultAction(params) {
    helper.defaultAction('trigger')
}

function listTrigger(params) {

    if (!props.validate()){
        return;
    }

    log.show(true);
    log.appendLine('\n$ openwsk trigger list');
    triggerList();
}

function triggerList() {

    if (!props.validate()){
        return;
    }

    return getList().then(function (triggers) {
        util.appendHeading('triggers');
        for (var x=0; x<triggers.length; x ++){
                util.appendEntry(triggers[x]);
        }
    }).catch(function(error) {
        log.appendLine(error.toString())
    });
}

function getList() {
    return new Promise(function (fulfill, reject){
        return ow.triggers.list().then(function (triggers) {
            fulfill(triggers);
        }).catch(function(error) {
            log.appendLine(error.toString())
        });
    });
}

function getListAsStringArray() {
    return getList().then(function (triggers) {
        var result = [];
        for (var x=0; x<triggers.length; x ++){
            var name = util.formatQualifiedName(triggers[x]);
            result.push(name)
        }
        return result;
    })
}



function createTrigger(params) {

    crTrgg.register(ow, context, log, props);
    crTrgg.createTrigger(params);
    // if (!props.validate()){
    //    return;
    // }

    // vscode.window.showInputBox({placeHolder:'Enter a name for your trigger:'})
    // .then(function(trigger){

    //     if (trigger == undefined) {
    //         return;
    //     }

    //     vscode.window.showInputBox({
    //         placeHolder:'Enter parameters to bind (-p key value) or leave blank for no parameters:',
    //         value:''
    //     }).then(function (parametersString) {

    //         var pString = ''
    //         if (parametersString != undefined) {
    //             pString = parametersString
    //         }

    //         log.show(true);
    //         log.appendLine('\n$ openwsk trigger create ' + trigger + ' ' + pString);

    //         var activityInterval = setInterval(function() {
    //             log.append('.');
    //         },300);


    //         var startTime = new Date().getTime();
    //         var invocationParams = {
    //             triggerName: trigger,
    //             blocking:true
    //         }

    //         if (pString.length>0) {
    //             var params = util.parseParametersString(pString);
    //             var paramsArray = [];

    //             for (var key in params) {
    //                 var object = {};
    //                 object.key = key;
    //                 object.value = params[key];
    //                 paramsArray.push(object)
    //             }

    //             invocationParams.trigger = {
    //                 "parameters":paramsArray
    //             };
    //         }
    //         ow.triggers.create(invocationParams)
    //         .then(function(result) {
    //             var totalTime = startTime - (new Date().getTime());
    //             clearInterval(activityInterval);
    //             log.appendLine(JSON.stringify(result,  null, 4))
    //             log.appendLine('>> completed in ' + (-totalTime) + 'ms');
    //         })
    //         .catch(function(error) {
    //             clearInterval(activityInterval);
    //             util.printOpenWhiskError(error);
    //         });
    //     });
    // });
}


function updateTrigger(params) {

    upTrgg.register(ow, context, log, props);
    upTrgg.updateTrigger(params);
    // if (!props.validate()){
    //     return;
    // }

    // var YES = 'Yes';
    // var NO = 'No';

    // vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a trigger to update:'})
    // .then(function(trigger){

    //     if (trigger == undefined) {
    //         return;
    //     }



    //     var triggerString = trigger.toString();
    //     var startIndex = triggerString.indexOf('/');
    //     var namespace = triggerString.substring(0, startIndex);
    //     var triggerToUpdate = triggerString.substring(startIndex+1);


    //     vscode.window.showInputBox({
    //         placeHolder:'Enter parameters to bind (-p key value) or leave blank for no parameters:',
    //         value:''
    //     }).then(function (parametersString) {

    //         var pString = ''
    //         if (parametersString != undefined) {
    //             pString = parametersString
    //         }

    //         log.show(true);
    //         log.appendLine('\n$ openwsk trigger update ' + trigger + ' ' + pString);

    //         vscode.window.showWarningMessage('Are you sure you want to overwrite ' + trigger, YES, NO)
    //         .then( function(selection) {
    //             if (selection === YES) {

    //                 var activityInterval = setInterval(function() {
    //                     log.append('.');
    //                 },300);

    //                 var startTime = new Date().getTime();
    //                 var invocationParams = {
    //                     triggerName: triggerToUpdate,
    //                     blocking:true,
    //                     namespace: namespace
    //                 }

    //                 if (pString.length>0) {
    //                     var params = util.parseParametersString(pString);
    //                     var paramsArray = [];

    //                     for (var key in params) {
    //                         var object = {};
    //                         object.key = key;
    //                         object.value = params[key];
    //                         paramsArray.push(object)
    //                     }

    //                     invocationParams.trigger = {
    //                         "parameters":paramsArray
    //                     };
    //                 }
    //                 ow.triggers.update(invocationParams)
    //                 .then(function(result) {
    //                     var totalTime = startTime - (new Date().getTime());
    //                     clearInterval(activityInterval);
    //                     log.appendLine(JSON.stringify(result,  null, 4))
    //                     log.appendLine('>> completed in ' + (-totalTime) + 'ms');
    //                 })
    //                 .catch(function(error) {
    //                     clearInterval(activityInterval);
    //                     util.printOpenWhiskError(error);
    //                 });

    //             } else {
    //                 log.appendLine('cancelled by user')
    //             }
    //         });

    //     });
    // });
}


function deleteTrigger(params) {

    dlTrgg.register(ow, context, log, props);
    dlTrgg.deleteTrigger(params);
    // if (!props.validate()){
    //     return;
    // }

    // vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a trigger to delete:'})
    // .then(function(trigger){

    //     if (trigger == undefined) {
    //         return;
    //     }

    //     var triggerString = trigger.toString();
    //     var startIndex = triggerString.indexOf('/');
    //     var namespace = triggerString.substring(0, startIndex);
    //     var triggerToDelete = triggerString.substring(startIndex+1);

    //     log.show(true);
    //     log.appendLine('\n$ openwsk trigger delete ' + triggerToDelete);

    //     var options = {
    //         triggerName: triggerToDelete
    //     };

    //     var YES = 'Yes';
    //     var NO = 'No';

    //     vscode.window.showWarningMessage('Are you sure you want to delete ' + triggerToDelete, YES, NO)
    //     .then( function(selection) {
    //         if (selection === YES) {
    //             ow.triggers.delete(options)
    //             .then(function(result) {
    //                 var message = 'OpenWhisk trigger deleted: ' + util.formatQualifiedName(result);
    //                 log.appendLine(message);
    //                 vscode.window.showInformationMessage(message);
    //             })
    //             .catch(function(error) {
    //                 util.printOpenWhiskError(error);
    //             });
    //         }
    //     });
    // });
}


function getTrigger(params) {

    gtTrgg.register(ow, context, log, props);
    gtTrgg.getTrigger(params);
    // if (!props.validate()){
    //     return;
    // }

    // vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a trigger to fetch:'})
    // .then(function(trigger){

    //     if (trigger == undefined) {
    //         return;
    //     }

    //     var triggerString = trigger.toString();
    //     var startIndex = triggerString.indexOf('/');
    //     var namespace = triggerString.substring(0, startIndex);
    //     var triggerToGet = triggerString.substring(startIndex+1);

    //     log.appendLine('\n$ openwsk trigger get ' + triggerToGet);

    //     var activityInterval = setInterval(function() {
    //         log.append('.');
    //     },300);

    //     var startTime = new Date().getTime();
    //     var invocationParams = {
    //         triggerName: triggerToGet,
    //         blocking:true,
    //         namespace: namespace
    //     }
    //     ow.triggers.get(invocationParams)
    //     .then(function(result) {
    //         var totalTime = startTime - (new Date().getTime());
    //         clearInterval(activityInterval);
    //         log.appendLine(JSON.stringify(result,  null, 4))
    //         log.appendLine('>> completed in ' + (-totalTime) + 'ms');
    //     })
    //     .catch(function(error) {
    //         clearInterval(activityInterval);
    //         util.printOpenWhiskError(error);
    //     });
    // });
}

function fireTrigger(params) {

    frTrgg.register(ow, context, log, props);
    frTrgg.fireTrigger(params);
    // if (!props.validate()){
    //     return;
    // }

    // vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a trigger to fire:'})
    // .then(function(trigger){

    //     if (trigger == undefined) {
    //         return;
    //     }

    //     var triggerString = trigger.toString();
    //     var startIndex = triggerString.indexOf('/');
    //     var namespace = triggerString.substring(0, startIndex);
    //     var triggerToFire = triggerString.substring(startIndex+1);

    //     vscode.window.showInputBox({
    //         placeHolder:'Enter parameters (-p key value) or leave blank for no parameters:',
    //         value:''
    //     }).then(function (parametersString) {

    //         var pString = ''
    //         if (parametersString != undefined) {
    //             pString = parametersString
    //         }

    //         log.show(true);
    //         log.appendLine('\n$ openwsk trigger fire ' + trigger + ' ' + pString);

    //         var activityInterval = setInterval(function() {
    //             log.append('.');
    //         },300);

    //         var startTime = new Date().getTime();
    //         var invocationParams = {
    //             triggerName: triggerToFire,
    //             blocking:true,
    //             namespace: namespace
    //         }

    //         if (pString.length>0) {
    //             invocationParams.params = util.parseParametersString(pString);
    //         }
    //         ow.triggers.invoke(invocationParams)
    //         .then(function(result) {
    //             var totalTime = startTime - (new Date().getTime());
    //             clearInterval(activityInterval);
    //             log.appendLine(`\nok: triggered ${trigger}`);
    //             log.appendLine(JSON.stringify(result, null, 4));
    //             log.appendLine('>> completed in ' + (-totalTime) + 'ms');
    //         })
    //         .catch(function(error) {
    //             clearInterval(activityInterval);
    //             util.printOpenWhiskError(error);
    //         });

    //     });
    // });
}


module.exports = {
    register: register,
    triggerList:triggerList,
    getListAsStringArray:getListAsStringArray
};
