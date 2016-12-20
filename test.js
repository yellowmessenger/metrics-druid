var metrics = require("./lib/metrics-kairosdb");
metrics.increment("stats.test.1",{
    "test":"test"
});