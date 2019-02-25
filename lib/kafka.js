const Kafka = require('node-rdkafka');

const producer = new Kafka.Producer({
    'client.id': 'metricProducer',
    'metadata.broker.list': 'kafka-0:9092,kafka-1:9092,kafka-2:9092',
    'batch.num.messages': 1,
    dr_cb: true
});

producer.connect();
producer.on('delivery-report', function(err, report) {
    // Report of delivery statistics here:
    //
    console.log(report);
});

const kafkaMetricPush = (message) => {
    producer.on('ready', function() {
        try {
            console.log('ready');
            producer.produce(
                // Topic to send the message to
                'metricsBots',
                // optionally we can manually specify a partition for the message
                // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
                null,
                // Message to send. Must be a buffer
                Buffer.from(message),
                // for keyed messages, we also specify the key - note that this field is optional
                null,
                // you can send a timestamp here. If your broker version supports it,
                // it will get added. Otherwise, we default to 0
                Date.now()
                // you can send an opaque token here, which gets passed along
                // to your delivery reports
            );
        } catch (err) {
            console.error('A problem occurred when sending our message');
            console.error(err);
        }
    });


}

module.exports = {
    kafkaMetricPush
}
