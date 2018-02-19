
var vscode = require('vscode');
let log = vscode.window.createOutputChannel("OpenWhisk");
var ow;

var props;
var context;
let util = require('./util.js');
let fs = require('fs');
let spawn = require('child_process').spawn;

var importDirectory = '/wsk-import/';

function register(_ow, _context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    context = _context
 
}

function defaultAction(params) {


        log.show(true);
      
        log.appendLine('\n$ wsk '+ params);
        log.appendLine('available commands:');

        if(params === 'action' || params === 'package' || params === 'rule' || params === 'trigger'){

            log.appendLine('     create              create new '+params);
            log.appendLine('     update              update an existing '+ params);
            log.appendLine('    get                 get '+params);
            log.appendLine('    delete              delete '+params);
            log.appendLine('    list                list all '+params);
        }

       if(params === 'trigger'){
        log.appendLine('    fire                fire trigger event');
     
       }
       
      if(params == 'rule'){
        log.appendLine('    enable              enable rule');
        log.appendLine('    disable             disable rule');
        log.appendLine('    status              get rule status');
 
      }
    
        if(params === 'action')
       {

        log.appendLine('     init                create new action boilerplate file');
        log.appendLine('     sequence            create a new sequence of actions');
        log.appendLine('     invoke              invoke action');
        log.appendLine('     rest                display CURL rest invocation parameters');
       }
       
 
      
       if(params === 'package'){
       
        log.appendLine('    bind                bind parameters to the package');
        log.appendLine('    refresh             refresh package bindings');
       }
   
   
       if(params === 'activation' ){

        log.appendLine('    list                retrieve activations');
        log.appendLine('    get                 get activation');
        log.appendLine('    logs                get the logs of an activation');
        log.appendLine('    result              get resul tof an activation');

       }


       if(params === 'help'){

        log.appendLine('     bluemix             launch OpenWhisk console on Bluemix');
        log.appendLine('     docs                open OpenWhisk docs');
        log.appendLine('     property set        set property');
        log.appendLine('     property unset      unset property');
        log.appendLine('     property get        get property');
        log.appendLine('     action              see available commands for OpenWhisk actions');

       }

        return;

}
module.exports = {
   register:register,
    defaultAction:defaultAction
};
