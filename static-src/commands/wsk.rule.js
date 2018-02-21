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


let wskAction = require('./wsk.action.js');
let wskTrigger = require('./wsk.trigger.js');

let helper = require('./helper.js');
let crRule = require('./ruleCommands/wsk.rule.create.js');
let upRule = require('./ruleCommands/wsk.rule.update.js');
let dlRule = require('./ruleCommands/wsk.rule.delete.js');
let gtRule = require('./ruleCommands/wsk.rule.get.js');
let stRule = require('./ruleCommands/wsk.rule.status.js');
let stcRule = require('./ruleCommands/wsk.rule.statusChange.js');

var log;
var ow;
var props;
var context;

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    context = context;

    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.rule', defaultAction);
    var listDisposable = vscode.commands.registerCommand('extension.wsk.rule.list', listRule);
    var createDisposable = vscode.commands.registerCommand('extension.wsk.rule.create', createRule);
    var updateDisposable = vscode.commands.registerCommand('extension.wsk.rule.update', updateRule);
    var deleteDisposable = vscode.commands.registerCommand('extension.wsk.rule.delete', deleteRule);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.rule.get', getRule);
    var statusDisposable = vscode.commands.registerCommand('extension.wsk.rule.status', statusRule);
    var enableDisposable = vscode.commands.registerCommand('extension.wsk.rule.enable', enableRule);
    var disableDisposable = vscode.commands.registerCommand('extension.wsk.rule.disable', disableRule);
    var enableAction = null;
    var disableAction = null;

    context.subscriptions.push(defaultDisposable, listDisposable, createDisposable, updateDisposable, deleteDisposable, getDisposable, statusDisposable, enableDisposable, disableDisposable, enableAction, disableAction);
}


function defaultAction(params) {
  helper.defaultAction('rule');
}

function listRule(params) {
    if (!props.validate()){
        return;
    }

    log.show(true);
    log.appendLine('\n$ wsk rule list');
    ruleList();
}

function ruleList() {
    if (!props.validate()){
        return;
    }

    return getList().then(function (rules) {
        util.appendHeading('rules');
        for (var x=0; x<rules.length; x ++){
                util.appendEntry(rules[x]);
        }
    }).catch(function(error) {
        log.appendLine(error.toString())
    });
}


function getList() {
    return new Promise(function (fulfill, reject){
        return ow.rules.list().then(function (rules) {
            fulfill(rules);
        }).catch(function(error) {
            log.appendLine(error.toString())
        });
    });
}


// corresponding functions for Rule commands

function createRule(params) {
    crRule.register(ow, context, log, props);
    crRule.createRule(params);
}

function updateRule(params) {
    upRule.register(ow, context, log, props);
    upRule.updateRule(params);
}

function deleteRule(params) {
    dlRule.register(ow, context, log, props);
    dlRule.deleteRule(params);
}

function getRule(params) {
    gtRule.register(ow, context, log, props);
    gtRule.getRule(params);
}

function statusRule(params) {
    stRule.register(ow, context, log, props);
    stRule.statusRule(params);
}

function enableRule(params) {
    stcRule.register(ow, context, log, props);
    stcRule.doStatusChange(undefined, true);
}

function disableRule(params) {
    stcRule.register(ow, context, log, props);
    stcRule.doStatusChange(undefined, false);
}

module.exports = {
    register: register,
    ruleList:ruleList
};
