
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
const sqs = require('@aws-cdk/aws-sqs');
const { S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');


const createLambdaFunction = require('../../utils/create-lambda-function');

class TranscribeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

    // A user uploads a video
    const videoInputBucket = fromBucketName(this, 'VideoInputBucket', `video-input-bucket-${stage}`);

    videoInputBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(extractAudioLambda))
    videoInputBucket.grantReadWrite(extractAudioLambda);

    const ffmpegLayer = new lambda.LayerVersion(this, 'ffmpeg-layer', {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_10_X,
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../layers/ffmpeg.zip')),
      description: 'ffmpeg use for lambda',
    });

    // We the extract the audio from it putting into extracted-audio-bucket

    const extractAudioLambda = createLambdaFunction({ 
      app: this,
      id: 'ExtractAudioLambda',
      functionName: 'extractAudioLambda',
      codeAssetPath: path.resolve(__dirname, '../../../build/extract-audio.zip'),
      handler: "extract-audio.handler",
      environment: {
        STAGE: process.env.STAGE,
        NODE_ENV: process.env.NODE_ENV,
        SUPABASE_API_URL: process.env.SUPABASE_API_URL,
        SUPABASE_API_KEY: process.env.SUPABASE_API_KEY,
        VIDEO_INPUT_BUCKET: videoInputBucket.bucketArn,
        EXTRACTED_VIDEO_AUDIO_BUCKET: extractAudioBucket.bucketArn
      },
      layers: [ffmpegLayer]
    }); 

    const extractedAudioBucket = fromBucketName(this, 'AudioExtractedBucket', `audio-extracted-bucket-${stage}`);

    // For the extracted audio, dispatch a job to Assembly A.I for transcribining

    // const sendTranscriptionLambda = createLambdaFunction({ 
    //   app: this,
    //   id: 'sendTranscriptionLambda',
    //   functionName: 'sendTranscriptionLambda',
    //   codeAssetPath: path.resolve(__dirname, '../../../build/send-transcribe-job.zip'),
    //   handler: "send-transcribe-job.handler",
    // }); 
    
    // extractAudioBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(sendTranscriptionLambda))
    // extractAudioBucket.grantReadWrite(extractAudioLambda);
    // // sendTranscriptionLambda.addEventSource( new S3EventSource(extractAudioBucket, {
    // //   events: [s3.EventType.OBJECT_CREATED]
    // // }));

    // assembly webhook api gateway

    // const apiGatewayName = `assembly-${stage}-webhook`;

    // const api = new apigateway.RestApi(this, 'ApiGatewayForApiService', {
    //   restApiName: apiGatewayName,
    //   deployOptions: { stageName: stage },
    //   failOnWarnings: true,
    //   proxy: false,
    // });

    // const assemblyWebhookApi = api.root.addResource('webhook');
    // addCorsOptions(assemblyWebhookApi);
  }
}

module.exports = { TranscribeService }