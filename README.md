# metrics-druid

## Installation

``` bash
npm install git+https://github.com/yellowmessenger/metrics-druid.git#0.3.3 --save
```

## Usage

An example of an express server with metrics-druid:

``` js
var express = require('express');
var serverStats = require('metrics-druid').serverStats;
var app = express();

app.use(serverStats({
    app:"<app-name>"
}));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000);
```

