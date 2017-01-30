#! /usr/bin/env node

var fs = require('fs');
var repl = require('repl');
var replHistory = require('repl.history');
var util = require('util');
var path = require('path');
var osHomedir = require('os-homedir');
var qs = require('query-string');
var JSON5 = require('json5');

var _ = require('lodash');
var chalk = require('chalk');
var argv = require('minimist')(process.argv.slice(2));

var tumblr = require('tumblr.js');

// Style output with ANSI color codes
function print(object) {
    console.log(util.inspect(object, null, null, true));
}

// Load credentials
var credentials = (function() {
    var credsFile = argv.credentials || _.find([
        'tumblr-credentials.json',
        'credentials.json',
        path.join(osHomedir(), 'tumblr-credentials.json'),
    ], function(credsFile) {
        return fs.existsSync(credsFile);
    }) || 'credentials.json';

    try {
        var credentials = JSON5.parse(fs.readFileSync(credsFile).toString());
    } catch (e) {
        console.error(chalk.red('Error loading credentials!'));
        console.error('Make sure %s exists or specify %s', chalk.cyan(credsFile || 'credentials.json'), chalk.cyan('--credentials=path/to/credentials.json'));
        process.exit();
    }

    console.log('\nUsing OAuth creds from %s\n', chalk.magenta(path.resolve(credsFile)));

    var missingCredentials = _.remove(['consumer_key', 'consumer_secret', 'token', 'token_secret'], _.partial(_.negate(_.has), credentials));
    if (!_.isEmpty(missingCredentials)) {
        console.warn(chalk.yellow('Credentials is missing keys:'));
        missingCredentials.forEach(function(key) {
            console.warn(chalk.yellow('  * %s'), key);
        });

        if (credentials.consumer_key && credentials.consumer_secret) {
            console.log('\nYou can generate user tokens by going to the API console:\n');
            console.log(chalk.magenta([
                'https://api.tumblr.com/console/auth',
                '?consumer_key=', credentials.consumer_key,
                '&consumer_secret=', credentials.consumer_secret,
            ].join('')));
        }
    }

    return credentials;
})();

// Print intro message
(function printIntro() {
    var ascii = fs.readFileSync(path.join(__dirname, 'ascii.md')).toString();
    // Logo: Blue
    ascii = ascii.replace(/```\n?([\s\S]*?)```\n?/m, chalk.blue('$1'));
    // Version numbers: White
    ascii = ascii.replace(/^(.* |)(tumblr-repl v)(0\.0\.0)(.*)/m, chalk.white('$1$2' + require('./package.json').version, '$4'));
    ascii = ascii.replace(/^(.* |)(tumblr.js v)(0\.0\.0)(.*)/m, chalk.white('$1$2' + require('tumblr.js/package.json').version, '$4'));
    // Indented text: Gray
    ascii = ascii.replace(/^(\s{4}\S.*)/gm, chalk.gray('$1'));
    // Highlights: Green
    ascii = ascii.replace(/(^|\s)`([^`]+)`(\s|$)/g, chalk.green('$1$2$3'));

    console.log(ascii);
})();

// Start REPL server
var server = repl.start({
    prompt: argv.prompt || 'tumblr.js > ',
    source: null,
    eval: null,
    useGlobal: false,
    useColors: true,
    ignoreUndefined: true,
});

// Save REPL history
replHistory(server, path.join(osHomedir(), '.tumblrjs_repl_history'));

// Save the last response
var _resp;

// Create the Tumblr API Client
var client = (function createTumblrClient() {
    var client = new tumblr.Client(credentials);

    // Provide a default callback for inspection
    var getRequest = client.getRequest;
    client.getRequest = function(apiPath, params, callback) {
        if (callback) {
            return getRequest.call(this, apiPath, params, callback);
        }

        var queryString = qs.stringify(params);
        var requestMessage = 'GET ' + apiPath + (queryString ? '?' + queryString : '');

        getRequest.call(this, apiPath, params, function(err, resp) {
            _resp = err || resp;
            if (err) {
                console.error('\n', chalk.red(requestMessage));
                console.error(chalk.red(err));
            } else {
                console.log('\n', chalk.green(requestMessage));
                print(resp, null, null, true);
            }
            server.displayPrompt(true);
        });
    };

    var postRequest = client.postRequest;
    client.postRequest = function(apiPath, params, callback) {
        if (callback) {
            return postRequest.call(this, apiPathß, params, callback);
        }

        var requestMessage = 'POST ' + apiPath;

        postRequest.call(this, apiPath, params, function(err, resp) {
            _resp = err || resp;
            if (err) {
                console.error('\n', chalk.red(requestMessage));
                console.error(chalk.red(err));
            } else {
                console.log('\n', chalk.green(requestMessage));
                print(resp, null, null, true);
            }
            server.displayPrompt(true);
        });
    };

    return client;
})();

// Set REPL context variables
(function(context) {
    context.lodash = _;
    context.tumblr = client;
    context.print = print;

    // Callback function that can be used to store an API response object in the REPL context
    context.set = function(err, object) {
        if (err) {
            return console.log(err);
        }

        context.result = object;
        print(object);
        console.log('Stored in variable: \'result\'');
    };

    Object.defineProperty(context, '_response', {
        get: function() {
            return _resp;
        },
    });

    Object.defineProperty(context, 'help', {
        get: function() {
            console.log('\n%s has the following methods:\n', chalk.blue('tumblr'));
            Object.keys(client).forEach(function(method) {
                if (method === 'postRequest' || method === 'getRequest' || typeof client[method] !== 'function') {
                    return;
                }
                if (typeof client[method] === 'function') {
                    var methodName = chalk.cyan(method);
                    var methodArgs = (client[method].toString().match(/\([^\)]*\)/) || [])[0]
                        .replace(/[\s\(\)]/gm, '')
                        .split(',')
                        .map(function(arg) {
                            if (arg === 'params' || arg === 'callback') {
                                return chalk.yellow(arg);
                            } else {
                                return chalk.green(arg);
                            }
                        })
                        .join(', ');

                    console.log('  %s(%s)', methodName, methodArgs);
                }
            });
            console.log('');
            console.log('%s stores the response from the last API request response.', chalk.magenta('_response'));
            console.log('');
        },
    });
})(server.context);

// Control + L should clear the REPL
process.stdin.on('keypress', function(s, key) {
    if (key && key.ctrl && key.name == 'l') {
        process.stdout.write('\u001B[2J\u001B[0;0f');
    }
});
