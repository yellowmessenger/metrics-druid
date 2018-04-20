const request = require('request');
const hostname = require('os').hostname();
const url  = "http://10.0.0.39:8200/v1/post/metrics";
const indiaUrl  = "http://10.4.0.50:8200/v1/post/metrics";

let sendData = function(metric,value,tags){
    if(Object.keys(tags).length>0 && (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "docker")  ){
        let metricData = {
            "metric": metric,
            "timestamp": new Date().getTime(),
            "value": value||1
        };
        metricData = Object.assign(tags, metricData);

        //TODO after an year deprecate this us request at 19 April 2019
        request({
            url:url,
            method:"POST",
            json: metricData,
            timeout: 1000
        },function(err,resp,body){
            if(err) {
                console.log(err);
            }
        });


        request({
            url:indiaUrl,
            method:"POST",
            json: metricData,
            timeout: 1000
        },function(err,resp,body){
            if(err) {
                console.log(err);
            }
        });
    }
};

let serverStats =  function(options) {
    return function(req, res, next) {
        let startTime = new Date().getTime();
        let path = req.path;

        // Function called on response finish that sends stats to statsd
        function sendStats() {
            if (hostname.indexOf("local") !== -1) {
                cleanup();
                return;
            }
            let app = options.app;

            // Status Code
            let statusCode = res.statusCode || 'unknown_status';

            // Increment
            sendData("service-requests",1,{
                "app":app,
                "node": hostname,
                "status-code":statusCode,
                "path":path
            });

            // Response Time
            let duration = new Date().getTime() - startTime;
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


let increment =  function(metric,tags) {
    sendData(metric,1,tags);
};

module.exports =  {
    serverStats:serverStats,
    increment:increment
};