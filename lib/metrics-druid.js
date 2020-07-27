const request = require('request');
const indiaUrl = process.env.DRUID_URL || "http://10.4.0.50:8200/v1/post/metrics?async=true";
const esURL = process.env.ELASTICSEARCH_URL ? process.env.ELASTICSEARCH_URL.split(",") : ["http://@es-master-0:9200",
    "http://@es-master-1:9200", "http://es-master-2:9200"];
const dataServiceUrl = process.env.DATA_SERVICE_URL || 'http://data-service.services:3000';

console.log('[ DRUID_METRICS_INFO ] Storage engine :', process.env.INSIGHTS_STORAGE || 'druid');
console.log('[ DRUID_METRICS_INFO ] Druid url : ', indiaUrl);
console.log('[ DRUID_METRICS_INFO ] Elastic search url : ', JSON.stringify(esURL));
console.log('[ DRUID_METRICS_INFO ] Data service url : ', dataServiceUrl);

const {Client} = require('@elastic/elasticsearch');
const esClient = new Client({node: esURL});

const customLogger = (...args) => {
    if(process.env.DRUID_LOG_LEVEL && process.env.DRUID_LOG_LEVEL.toLowerCase() === 'debug'){
        console.log(`[ DRUID_METRICS_INFO ]`, ...args);
    }
}

let sendData = function (metric, tags, value) {
    if (Object.keys(tags).length === 0 || (tags.uid && tags.uid.startsWith('test'))) {
        return;
    }
    if (process.env.INSIGHTS_STORAGE === "elasticsearch") {
        let metricData = {
            "@timestamp": (new Date()).toISOString(),
            "value": value
        };

        metricData = Object.assign(tags, metricData);

        return request({
            url: `${esURL}/botmetrics-${metric}/_doc`,
            method: "POST",
            json: metricData,
            timeout: 500
        }, function (err) {
            if (err) {
                console.log(err);
            }
        });
    }

    let metricData = {
        "metric": metric,
        "timestamp": new Date().getTime(),
        "value": value
    };
    metricData = Object.assign(tags, metricData);
    if (metricData.uid && metricData.uid.startsWith('test')) {
        console.log('test user not added to analytics');
        return;
    }

    if (metric === 'events.bots.custom') {
        const botId = tags.user || tags.botId || 'common';
        tags.es_doc_props = {
            id: 'analytics',
            index: `${botId}_analytics`,
            action: 'index'
        };
        delete tags.user;
        delete tags.botId;
        delete tags.metric;
        const options = {
            url: `${dataServiceUrl}/internal/rabbit/publish`,
            method: "POST",
            json: {
                queue: 'index-queue',
                data: JSON.stringify(tags)
            },
            timeout: 500
        };
        return request(options, function (err, response, body) {
            if (err) {
                console.log(err, body)
            }
        });
    }
    request({
        url: indiaUrl,
        method: "POST",
        json: metricData,
        timeout: 500
    }, function (err) {
    });
};

const queueMapping = {
    'userEvents': 'druid-bot-user-queue',
    'botEvents': 'druid-bot-queue',
    'agentEvents': 'druid-agent-queue',
    'apiEvents': 'druid-api-queue',
    'messages': 'druid-message-queue',
    'test': 'test-queue'
};

let metricsPush = (source, tags) => {
    if (Object.keys(tags).length === 0 || (tags.uid && tags.uid.startsWith('test'))) {
        return;
    }

    if (process.env.INSIGHTS_STORAGE === "elasticsearch") {

        let metricData = {
            "@timestamp": (new Date()).toISOString(),
            ...tags
        };

        source = source && source.toLowerCase();
        customLogger(`-- ${source} --`, JSON.stringify(tags));
        metricData = Object.assign(tags, metricData);

        return request({
            url: `${esURL}/${source}/_doc`,
            method: "POST",
            json: metricData,
            timeout: 500
        }, function (err) {
            if (err) {
                console.log(err);
            }
        });
    }

    tags.timestamp = new Date().getTime();
    const options = {
        url: `${dataServiceUrl}/internal/rabbit/publish`,
        method: "POST",
        json: {
            queue: queueMapping[source] || queueMapping.test,
            data: JSON.stringify(tags)
        },
        timeout: 500
    };
    request(options, function (err, response, body) {
        if (err) {
            console.log(err, body)
        }
    });
};

let increment = function (metric, tags, value) {
    sendData(metric, tags, value || 1);
};

module.exports = {
    increment,
    metricsPush
};
