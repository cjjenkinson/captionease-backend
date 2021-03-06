import uuidv4 from "uuid/v4";
import fs from "fs";
import path from "path";
import os from "os";
import { createClient } from '@supabase/supabase-js'

import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";
import { spawnPromise } from "../../../utils/spawn-promise";

import { createS3Client } from "../../../utils/aws/s3";

import customConfig from './config';
import { generateUUID } from "../../../utils/uuid";

const createClients = (config: any) => ({
  s3: createS3Client(),
});

process.env.PATH =
  process.env.PATH + ":" + process.env.LAMBDA_TASK_ROOT + "/bin";

const getExtension = (filename: string) => {
  const ext = path.extname(filename || "").split(".");

  return ext[ext.length - 1];
};

async function extractAudio(event, { logger }) {
  const config = getConfig(customConfig);

	const clients = createClients(config);

	

	try {

		await fs.readdir('/tmp/',async (err, files) => {
			if (err) throw err;
			logger.info(`do you like files ${files}`);
			for (const file of files) {
			  await fs.unlink(path.join('/tmp/', file), err => {
				if (err) throw err;
			  });
			}
		  });

		logger.info('inside the extract audio lambda')
		logger.info(JSON.stringify(event));

		const eventRecord = event.Records && event.Records[0];

		const id = generateUUID();
		const inputBucket = eventRecord.s3.bucket.name;
		const key = eventRecord.s3.object.key;

		logger.info(`Getting bucket, key: ${key} inputBucket: ${inputBucket} `);

		const blob = await clients.s3.get({ bucket: inputBucket, key});
		const body = blob?.Body;

		const videoKeyName = `/tmp/${key}`;
		const audioKeyName = `/tmp/test.mp3`;

		// @ts-ignore
		// defensive check later


		logger.info('Writing video file to temp...');

		
		fs.writeFileSync(videoKeyName, body);

		const args = [
			"-i" ,
		   videoKeyName,
			"-q:a",
			 "0",
			"-map a",
			audioKeyName
		];

		//replace with mp4 with mp3
		logger.info(`Extracting audio from video :: Video key ${inputBucket}/${key}`);

		fs.readdirSync('/opt/').forEach(file => {
			logger.info(`opt: ${file}`);
		});
		
		
		const stout = childProcess.execFileSync("/opt/ffmpeg", args, {});
// 		ID (generate an ID using uuid package)
// state (starts with pending)
// videoBucketKey (location of uploaded video on s3)
// extractedAudioKey (location of extracted audio key, will be null initially)
// transcriptionState (starts with pending)
// transcriptionKey (location of transcription SRT file from Assembly.AI, will be null initially)

		logger.info(`Extracting audio from video :: Video key ${inputBucket}/${key}`);


		const blob = await clients.s3.get({ bucket: inputBucket, key});
		logger.info(`da blob ${blob}`);
		logger.info('pas the blobl')
	
		const body = blob?.Body?.toString();
		logger.info(`da body ${JSON.stringify(body)}`);
		logger.info('pas the body')

		const videoKeyName = `/tmp/${key}`;
		const audioKeyName = `/tmp/test.mp3`;
		logger.info('past key anems');
		// @ts-ignore
		// defensive check later


		logger.info('Writing video file to temp...');

		if(body){
			fs.writeFileSync(videoKeyName, body);
		}

		const args = [
			"-i" ,
		   videoKeyName,
			"-q:a",
			 "0",
			"-map a",
			audioKeyName
		];

		//replace with mp4 with mp3
		logger.info(`xffmphe lahyer time`);
		

		// await fs.renameSync('/opt/ffmpeg', '/tmp/ffmpeg');
		// await fs.chmodSync('/tmp/ffmpeg', '777');

		fs.readdir('/opt/ffmpeg', (err, files) => {
			files.forEach(file => {
			  logger.info(file);
			});
		  });

		const stout = childProcess.execFileSync("/opt/ffmpeg/", args, {});

		const audioBucket = 'development-transcribese-extractaudiobucket197901-4zaqtw7geuta';

		const audioName = fs.readFileSync(audioKeyName);
		logger.info(`audoName:${audioName} Reading audio file...`);

		clients.s3.put({ file: audioName, bucket: audioBucket, key: audioKeyName });
		
		const {data, error} = await clients.supabase.from('Video').insert([{
			id,
		    state: 'pending',
			videoBucketKey: key,
			extractedAudioKey: null,
			transcriptionState: 'pending',
			transcriptionKey: null
		}]);
		if (error) {
			throw new Error(`Failed to retrive video upload :: ${error.message}`)
		}

		logger.info(`Retrieved video ${JSON.stringify(data)}`);


		// compress video
		// split video into audio
		// create audioKey
		// store audio in s3
		// update video record with audio key

		// 	const id = context.awsRequestId,
		// 	const resultKey = key.replace(/\.[^.]+$/, EXTENSION),
		// 	const workdir = os.tmpdir(),
		// 	const inputFile = path.join(workdir,  id + path.extname(key)),
		// 	const outputFile = path.join(workdir, id + EXTENSION);

		// return s3Util.downloadFileFromS3(inputBucket, key, inputFile)
		// 	.then(() => childProcessPromise.spawn(
		// 		'/opt/bin/ffmpeg',
		// 		['-loglevel', 'error', '-y', '-i', inputFile, '-vf', `thumbnail,scale=${THUMB_WIDTH}:-1`, '-frames:v', '1', outputFile],
		// 		{
		//       env: process.env, 
		//       cwd: workdir
		//     }
		// 	))
		// 	.then(() => s3Util.uploadFileToS3(OUTPUT_BUCKET, resultKey, outputFile, MIME_TYPE));

		// development-encodeservic-videoinputbucket940f4f43-iy9if872u4ib

		const audioBucket = 'development-encodeservice-extractaudiobucket197901-1wjvufyahi68c';

		const audioName = fs.readFileSync(audioKeyName);
		logger.info(`audoName:${audioName} Reading audio file...`);

		clients.s3.put({ file: audioName, bucket: audioBucket, key: audioKeyName });

		// //.... rest of the logic to clear up locally written files from running the executable


		// // compress video
		// // split video into audio
		// // create audioKey
		// // store audio in s3
		// // update video record with audio key

	
	} catch (error) {
		logger.error(error);
		fs.readdir('/tmp/', (err, files) => {
			if (err) throw err;
			
			for (const file of files) {
			  fs.unlink(path.join('/tmp/', file), err => {
				if (err) throw err;
				logger.info(`Deleting ${file}`);
			  });
			}
		});	

		logger.info('cleaning out tmp')
		await fs.readdir('/tmp/',async (err, files) => {
			if (err) throw err;
			logger.info(files);

		  
			for (const file of files) {
			  await fs.unlink(path.join('/tmp/', file), err => {
				if (err) throw err;
			  });
			}
		  });

    throw error;
	}
}

const options = {
  name: "extract-audio",
};

export const handler = lambdaWrapper(
  async (event, context) => extractAudio(event, context),
  options
);
