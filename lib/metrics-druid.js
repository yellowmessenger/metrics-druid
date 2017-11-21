var request = require('request');
var hostname = require('os').hostname();
var url  = "http://10.4.0.33:8200/v1/post/metrics";

var sendData = function(metric,value,tags){
    if(Object.keys(tags).length>0){
        var metricData = {
            "metric": metric,
            "timestamp": new Date().getTime(),
            "value": value||1
        };
        metricData = Object.assign(tags,metricData);
        request({
            url:url,
            method:"POST",
            json: metricData
        },function(err,resp,body){
            if(err) {
                console.log(err);
            }
        });
    }
};

var serverStats =  function(options) {
    return function(req, res, next) {
        var startTime = new Date().getTime();
        var path = req.path;

        // Function called on response finish that sends stats to statsd
        function sendStats() {
            if (hostname.indexOf("local") !== -1) {
                cleanup();
                return;
            }
            var app = options.app;

            // Status Code
            var statusCode = res.statusCode || 'unknown_status';

            // Increment
            sendData("service-requests",1,{
                "app":app,
                "node": hostname,
                "status-code":statusCode,
                "path":path
            });

            // Response Time
            var duration = new Date().getTime() - startTime;
            // Duration
            sendData("service-response-time",duration,{
                "app":app,
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