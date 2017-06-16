/**
 * Created by Peter Sbarski
 * Serverless Architectures on AWS
 * http://book.acloud.guru/
 * Last Updated: Feb 11, 2017
 *
 * Modified by Ron Rabakukk on June 14, 2017
 * Added solutions to exercises from Chapter 3
 */

'use strict';
var AWS = require('aws-sdk');

var elasticTranscoder = new AWS.ElasticTranscoder({
  region: 'us-east-1'
});

exports.handler = function(event, context, callback) {
  console.log('Welcome');
  continue = true;

  if (event != null) {
    try { //EventKeyManipulation
      var key = event.Records[0].s3.object.key;
      console.log('key=' + key);

      //the input file may have spaces so replace them with '+'
      var sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));
      console.log('sourceKey=' + sourceKey);

      //remove the extension
      var lastIndex = sourceKey.lastIndexOf("."); //Exercise 3.6.1
      var outputKey = sourceKey.substr(0, lastIndex); //Exercise 3.6.1
      console.log('outputKey=' + outputKey);

      //Use lastIndexOf in case there are multiple periods
      var extension = sourceKey.substr(lastIndex + 1);
      console.log('extension:' + extension);
    } catch (err) {
      console.log("ERROR:TranscodeVideo.js:EventKeyManipulation: " + err);
      error = new Error("ERROR:TranscodeVideo.js:EventKeyManipulation: " + err);
      callback(error);
    }

    //Exercise 3.6.8 - Verify that the name is unique to the transcoded bucket
    try { //VerifyUniqueFileName
      var params = {
        Bucket: 'ron-serverless-video-transcoded' /* required */
        //Delimiter: 'STRING_VALUE',
        //EncodingType: url,
        //Marker: 'STRING_VALUE',
        //MaxKeys: 0,
        //Prefix: 'STRING_VALUE',
        //RequestPayer: requester
      };
      s3.listObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });
    } catch (err) {
      console.log("ERROR:TranscodeVideo.js:VerifyUniqueFileName: " + err);
      error = new Error("ERROR:TranscodeVideo.js:VerifyUniqueFileName: " + err);
      callback(error);
    }

    //Only process files that have avi, mp4 or mov extensions
    //Exercise 3.6.2
    if (extension.toLowerCase() == "avi" ||
      extension.toLowerCase() == "mp4" ||
      extension.toLowerCase() == "mov") {
      try {
        var params = {
          PipelineId: '1496804723750-48tcgm',
          OutputKeyPrefix: outputKey + '/',
          Input: {
            Key: sourceKey
          },
          Outputs: [{
              Key: outputKey + '-1080p' + '.mp4',
              PresetId: '1351620000001-000001' //Generic 1080p
            },
            {
              Key: outputKey + '-720p' + '.mp4',
              PresetId: '1351620000001-000010' //Generic 720p
            },
            {
              Key: outputKey + '-web-720p' + '.mp4',
              PresetId: '1351620000001-100070' //Web Friendly 720p
            } { //Exercise 3.6.5
              Key: outputKey + '-hls-v3' + '.mp4',
              PresetId: '1351620000001-200010' //
            } { //Exercise 3.6.5
              Key: outputKey + '-webm-720p' + '.mp4',
              PresetId: '1351620000001-100240' //
            }
          ]
        };
        elasticTranscoder.createJob(params, function(error, data) {
          if (error) {
            callback(error);
          }
        });
      } catch (err) {
        console.log("An error occurred: " + err);
        error = new Error("ERROR:TranscodeVideo.js:EventKeyManipulation:" + err);
        callback(error);
      }
    } else { //Exercise 3.6.2 - Delete any invalid files
      console.log("The extension " + extension + " is not a correct type to be processed by this function.");
      //Delete the file from the bucket.
      try {
        console.log("Attempting to delete the file from S3.");
        var params = {
          Bucket: event.Records[0].s3.bucket.name,
          Key: sourceKey
        };
        console.log("params= " + JSON.stringify(params));
        var s3 = new AWS.S3();
        s3.deleteObject(params, function(err, data) {
          if (err) console.log(err, err.stack);
          else console.log(data);
        });
        console.log("Object " + event.Records[0].s3.object.key + " delete complete, but check log to verify.");
      } catch (err) {
        console.log("!!! ERROR deleting S3 object: " + err.message);
      }
    }
  }
};
