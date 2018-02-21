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

// corresponding functions for Trigger commands

function createTrigger(params) {
    crTrgg.register(ow, context, log, props);
    crTrgg.createTrigger(params);
}


function updateTrigger(params) {
    upTrgg.register(ow, context, log, props);
    upTrgg.updateTrigger(params);
}


function deleteTrigger(params) {
    dlTrgg.register(ow, context, log, props);
    dlTrgg.deleteTrigger(params);
}


function getTrigger(params) {
    gtTrgg.register(ow, context, log, props);
    gtTrgg.getTrigger(params);
}

function fireTrigger(params) {
    frTrgg.register(ow, context, log, props);
    frTrgg.fireTrigger(params);
}


module.exports = {
    register: register,
    triggerList:triggerList,
    getListAsStringArray:getListAsStringArray
};
