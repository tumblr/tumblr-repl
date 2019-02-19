# tumblr.js REPL

An interactive [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) for the [tumblr.js](https://www.github.com/tumblr/tumblr.js) that you can use to make calls to the Tumblr API.

## Installation

    npm install -g tumblr-repl

## Usage

You can enter the interactive console like this:

    $ tumblr

### Authentication

You'll need a credentials file that defines `consumer_key`, `consumer_secret`, `token`, and `token_secret` in order to authenticate requests. You can specify the path to it directly:

    $ tumblr --credentials=path/to/credentials.json

Otherwise, it will look for `tumblr-credentials.json` or `credentials.json` in the current directory. Failing that, it will look for `tumblr-credentials.json` in your home directory.

### Client Methods

In the REPL console, the `tumblr` object holds the instance of the Tumblr client with the credentials you supplied. For convenience, we automatically supply a callback if you omit one, so you can do things like this:

    tumblr.js > tumblr.blogInfo('staff')

...and the response will print right before your eyes. What a time to be alive!

Type `help` to get a list of methods on the client.

---

# Copyright and license

Copyright 2019 Tumblr, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this work except in compliance with the License. You may obtain a copy of
the License in the [LICENSE](LICENSE) file, or at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations.
