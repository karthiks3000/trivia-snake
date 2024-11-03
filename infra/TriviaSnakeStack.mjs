import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TriviaSnakeStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // DynamoDB Table
    const leaderboardTable = new dynamodb.Table(this, 'LeaderboardTable', {
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'TriviaSnakeUsers',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Lambda Function
    const leaderboardFunction = new lambda.Function(this, 'LeaderboardFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      environment: {
        LEADERBOARD_TABLE_NAME: leaderboardTable.tableName,
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    leaderboardTable.grantReadWriteData(leaderboardFunction);
    usersTable.grantReadWriteData(leaderboardFunction);
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'TriviaSnakeApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });

    // Create a resource and add methods
    const leaderboardResource = api.root.addResource('leaderboard');
    const registerResource = api.root.addResource('register');
    const loginResource = api.root.addResource('login'); 
    
    // Add GET method
    leaderboardResource.addMethod('GET', new apigateway.LambdaIntegration(leaderboardFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      }],
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    // Add POST method
    leaderboardResource.addMethod('POST', new apigateway.LambdaIntegration(leaderboardFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      }],
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    // Add POST method
    registerResource.addMethod('POST', new apigateway.LambdaIntegration(leaderboardFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      }],
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    // Add POST method
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(leaderboardFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      }],
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

       // S3 bucket for frontend
       const websiteBucket = new s3.Bucket(this, 'TriviaSnakeWebsiteBucket', {
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
  
      // CloudFront Origin Access Identity
      const oai = new cloudfront.OriginAccessIdentity(this, 'TriviaSnakeOAI', {
        comment: "Origin Access Identity for Trivia Snake website",
      });
  
      // Grant read permissions to the OAI
      websiteBucket.grantRead(oai);
  
      // CloudFront distribution
      const distribution = new cloudfront.Distribution(this, 'TriviaSnakeDistribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(websiteBucket, {
            originAccessIdentity: oai
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
      });
  
      // Deploy frontend to S3
      new s3deploy.BucketDeployment(this, 'TriviaSnakeBucketDeployment', {
        sources: [s3deploy.Source.asset(path.join(__dirname, '..', 'build'))],
        destinationBucket: websiteBucket,
        distribution,
        distributionPaths: ['/*'],
      });

    // Output the API URL and CloudFront URL
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'CloudFrontUrl', { value: `https://${distribution.domainName}` });
  }
}
