var request = require('request');
var hostname = require('os').hostname();
var url  = "http://10.0.0.39:8200/v1/post/metrics";

var metrics = [];
var lastSent = 0;

var sendData = function(metric,value,tags){
    if(Object.keys(tags).length>0){
        var metricData = {
            "name": metric,
            "timestamp": new Date().getTime(),
            "value": value||1
        };
        metricData = Object.assign(tags,metricData);
        metrics.push(metricData);

        if(metrics.length==10 || (new Date().getTime())-metrics>=60000){
            var data  = metrics;
            metrics = [];
            lastSent = new Date().getTime();
            request({
                url:url,
                method:"POST",
                json: data
            },function(err,resp,body){
                console.log(body);
            });
        }
    }
};

var serverStats =  function(options) {
    return function(req, res, next) {
        var startTime = new Date().getTime();
        var path = req.path;

        // Function called on response finish that sends stats to statsd
        function sendStats() {
            if (hostname.indexOf("local") != -1) {
                cleanup();
                return;
            }
            var app = options.app;

            // Status Code
            var statusCode = res.statusCode || 'unknown_status';

            // Increment
            sendData("server-stats.count."+app,1,{
                "node": hostname,
                "status-code":statusCode,
                "path":path
            });


            // Response Time
            var duration = new Date().getTime() - startTime;
            // Duration
            sendData("server-stats.response-time."+app,duration,{
                "node": hostname,
                "path":path
            });

            cleanup();
        }

        // Function to clean up the listeners we've added
        function cleanup() {
            res.removeListener('finish', sendStats);
            res.removeListener('error', cleanup);
            res.removeListener('close', cleanup);
        }

        // Add response listeners
        res.once('finish', sendStats);
        res.once('error', cleanup);
        res.once('close', cleanup);

        if (next) {
            next();
        }
    }
};


var increment =  function(metric,tags) {
    sendData(metric,1,tags);
};

module.exports =  {
    serverStats:serverStats,
    increment:increment
};