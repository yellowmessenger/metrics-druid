var metrics = require("./lib/metrics-druid");
for(var i = 0; i < 20; i++){
    metrics.increment("stats.test.1",{
        "test":"test"
    });
}

