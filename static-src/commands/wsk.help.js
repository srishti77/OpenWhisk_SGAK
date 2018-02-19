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

var log;
var ow;
var props;
let helper = require('./helper.js');

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;

    var disposable = vscode.commands.registerCommand('extension.wsk.help', defaultAction);
    context.subscriptions.push(disposable);
}

function defaultAction(params) {

    helper.defaultAction('help');
  
}

module.exports = {
    register: register
};
