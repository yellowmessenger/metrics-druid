const request = require('request');
const hostname = require('os').hostname();
//const configStore = require('configstore');
const indiaUrl = "http://10.4.0.50:8200/v1/post/metrics?async=true";
const metricPushUrl = 'http://10.4.0.50:8200/v1/post/';
const esURL = ["http://elastic:DowDF5qPpu6WOOGvr48q@es-node-0:9200",
    "http://elastic:DowDF5qPpu6WOOGvr48q@es-node-1:9200", "http://elastic:DowDF5qPpu6WOOGvr48q@es-node-2:9200"];


const {Client} = require('@elastic/elasticsearch')
const esClient = new Client({node: esURL})
// const elasticSearch = require('elasticsearch');
// const esClient = new elasticSearch.Client({
//     host: esURL
// });

const ConfigStore = require('configstore');
const config = new ConfigStore("metrics").get("config");
// const {kafkaMetricPush} = require('./kafka')

let sendData = function (metric, tags, value) {
    if (Object.keys(tags).length === 0) {
        return;
    }
    if (process.env.NODE_ENV === "deployment") {

        let metricData = {
            "@timestamp": (new Date()).toISOString(),
            "value": value
        };

        metricData = Object.assign(tags, metricData);
        if (metricData.uid && metricData.uid.startsWith('test')) {
            return;
        }

        return request({
            url: `${config.esUrl}/botmetrics-${metric}/_doc`,
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
    // metricData = JSON.stringify(metricData);
    // kafkaMetricPush(metricData);
    if (metricData.uid && metricData.uid.startsWith('test')) {
        console.log('test user not added to analytics');
        return;
    }

    if (metric === 'events.bots.custom') {
        const botId = tags.user || tags.botId || 'common';
        delete tags.user;
        delete tags.botId;
        delete tags.metric;
        return esClient.index({
            index: `${botId}_analytics`,
            body: tags
        }).then(e => {
            console.log(e)
        }).catch(e => {
            console.log(e)
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

// sendData("events.bots.custom", {
//     sachin: "i rock",
//     user: "x1556277369801",
//     rank : 1033
// },1 )


let metricsPush = (source, tags) => {
    if (Object.keys(tags).length === 0) {
        return;
    }
    tags.timestamp = new Date().getTime();
    tags.value = tags.value || 1;
    const options = {
        url: `${metricPushUrl}${source}?async=true`,
        method: "POST",
        json: tags,
        timeout: 500
    };
    request(options, function (err, response, body) {
        console.log(err, body);
    });

};

// metricsPush("contextEvents", {
//     "botId": "sachin123",
//     "source": "Sachin",
//     "event": "sac-event",
//     "journey": 'wsachin'
// });

let increment = function (metric, tags, value) {
    sendData(metric, tags, value || 1);
};

module.exports = {
    increment,
    metricsPush
};
