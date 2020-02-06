const request = require('request');

const dataServiceUrl = "http://data-service.services:3000/internal/rabbit/publish";

const queueMapping = {
    'contextEvents': 'druid-context-queue',
    'botEvents': 'druid-bot-queue',
    'messages': 'druid-message-queue',
    'test': 'test-queue'
};

let metricsPush = (source, tags) => {
    if (Object.keys(tags).length === 0) {
        return;
    }
    tags.timestamp = tags.timestamp || new Date().getTime();
    const options = {
        url: dataServiceUrl,
        method: "POST",
        json: {
            queue: queueMapping[source],
            data: JSON.stringify(tags)
        },
        timeout: 500
    };
    request(options, function (err, response, body) {
        if(err) {
            console.log(err, body)
        }
    });
};

// metricsPush('messages', {
//     "botId": "x15321fds95756954",
//     "source": "voice",
//     "uid": "116197986601508612565065667",
//     "sessionId": "5e394783e5f3db0010247167",
//     "sessionTime": "0.441",
//     "messageType": "BOT",
//     "utm_source": null,
//     "utm_campaign": null,
//     "utm_medium": null
// });



module.exports = {
    metricsPush
};