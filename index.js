const AWS = require('aws-sdk'),
	async = require('async'),
	ec2 = new AWS.EC2({ region: 'us-east-1' }),
	moment = require('moment');

const log = (data, cb) => {
	console.log(JSON.stringify(data, null, '\t'));
	cb(null, data);
}

const getInstances = cb => {
	async.waterfall([
		cb => ec2.describeInstances({}, cb),
		(data, cb) => {
			const instances = [];

			data.Reservations.forEach(x => {
				x.Instances.forEach(instance => {
					const id = instance.InstanceId;
					const name = instance.Tags.filter(tag => tag.Key === 'Name')[0].Value;
					instances.push({ id, name });
				});
			});

			cb(null, instances);
		}
	], cb);
}

const createImages = (instances, cb) => async.eachLimit(instances, 2, createImage, cb);

const createImage = (instance, cb) => {
	const name = `${moment().format('YYYYMMDD')}-${instance.name}`;
	console.log(`CREATING IMAGE ${name}`);

	ec2.createImage({
		InstanceId: instance.id,
		Name: name
	}, cb);
}

async.waterfall([
	getInstances,
	createImages
]);