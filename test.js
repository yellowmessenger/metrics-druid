var metrics = require("./lib/metrics-druid");
for(var i = 0; i < 3; i++){
    metrics.increment("stats.test.1",{
        "test":"test"
    });
}
