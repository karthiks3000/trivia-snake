import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TriviaSnakeStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const allowedURLs = ['http://localhost:3000', 'https://dj3xrj5xgqclx.cloudfront.net'];

    // S3 bucket for storing adventure images
    const adventureImagesBucket = new s3.Bucket(this, 'TriviaSnakeResources', {
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      websiteIndexDocument: 'index.html',
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: allowedURLs,
          allowedHeaders: ['*'],
        },
      ],
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'TriviaSnakeUserPool', {
      userPoolName: 'trivia-snake-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        preferredUsername: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

        // Add a resource server
    const resourceServer = userPool.addResourceServer('TriviaSnakeResourceServer', {
      identifier: 'trivia-snake',
      scopes: [
        {
          scopeName: 'read',
          scopeDescription: 'Read access to Trivia Snake resources',
        },
        {
          scopeName: 'write',
          scopeDescription: 'Write access to Trivia Snake resources',
        },
      ],
    });


    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'TriviaSnakeUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,  
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: allowedURLs, // Your CloudFront URL
        logoutUrls: allowedURLs, // Your CloudFront URL
      },
    });

    // DynamoDB Tables
    const leaderboardTable = new dynamodb.Table(this, 'LeaderboardTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'adventureId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // DynamoDB table for storing adventure data
    const adventureTable = new dynamodb.Table(this, 'AdventureTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Lambda Function
    const leaderboardFunction = new lambda.Function(this, 'LeaderboardFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      environment: {
        LEADERBOARD_TABLE_NAME: leaderboardTable.tableName,
        ADVENTURE_TABLE_NAME: adventureTable.tableName,
        ADVENTURE_IMAGES_BUCKET: adventureImagesBucket.bucketName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    leaderboardTable.grantReadWriteData(leaderboardFunction);
    adventureTable.grantReadWriteData(leaderboardFunction);
    adventureImagesBucket.grantReadWrite(leaderboardFunction);

    // Grant permissions to call Amazon Bedrock
    leaderboardFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:ListFoundationModels',
      ],
      resources: ['*'], // You might want to restrict this to specific model ARNs if known
    }));

    // Grant S3 permissions to the Lambda function
    leaderboardFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:DeleteObject',
      ],
      resources: [adventureImagesBucket.arnForObjects('*')],
    }));
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'TriviaSnakeApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: allowedURLs,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });

    // Cognito User Pool Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TriviaSnakeAuthorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    // Create resources and add methods
    const leaderboardResource = api.root.addResource('leaderboard');
    const adventuresResource = api.root.addResource('adventures');
    const adventureIdResource = adventuresResource.addResource('{id}');
    const generateQuizResource = api.root.addResource('generate-quiz');
    
    // Add methods for leaderboard resource
    ['GET', 'POST'].forEach(method => {
      leaderboardResource.addMethod(method, new apigateway.LambdaIntegration(leaderboardFunction, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        }],
      }), {
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        }],
      });
    });

    // Add methods for adventures resource
    ['GET', 'POST'].forEach(method => {
      adventuresResource.addMethod(method, new apigateway.LambdaIntegration(leaderboardFunction, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        }],
      }), {
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        }],
      });
    });

    // Add methods for adventure/{id} resource
    ['GET', 'PUT', 'DELETE'].forEach(method => {
      adventureIdResource.addMethod(method, new apigateway.LambdaIntegration(leaderboardFunction, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        }],
      }), {
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        }],
      });
    });

    // Add method for generate-quiz resource
    generateQuizResource.addMethod('POST', new apigateway.LambdaIntegration(leaderboardFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      }],
    }), {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
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

    /// CloudFront Origin Access Control
    const oac = new cloudfront.CfnOriginAccessControl(this, 'TriviaSnakeOAC', {
      originAccessControlConfig: {
        name: 'TriviaSnakeOAC',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });
  
      // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'TriviaSnakeDistribution', {
      defaultBehavior: {
        origin: new origins.S3BucketOrigin(websiteBucket),
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
    // Associate the OAC with the distribution
    const cfnDistribution = distribution.node.defaultChild;
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.ref);

    // Update bucket policy to allow access from CloudFront using OAC
    const bucketPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      resources: [websiteBucket.arnForObjects('*')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        },
      },
    });

    websiteBucket.addToResourcePolicy(bucketPolicyStatement);
    

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
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });

    // Lambda Invocations Alarm (across all functions)
    new cloudwatch.Alarm(this, 'LambdaInvocationsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Invocations',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 1000000 / 720, // Approximately 1 million per month, divided by 720 hours in a 30-day month
      evaluationPeriods: 24,
      alarmDescription: 'Alarm if Lambda invocations across all functions exceed 1 million per month',
    });

    // DynamoDB Consumed Read Capacity Units Alarm (across all tables)
    new cloudwatch.Alarm(this, 'DynamoDBReadCapacityUnitsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ConsumedReadCapacityUnits',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 18600 / 720, // 18600 per month, divided by 720 hours in a 30-day month
      evaluationPeriods: 24,
      alarmDescription: 'Alarm if DynamoDB read capacity units across all tables exceed 18600 per month',
    });

    // DynamoDB Consumed Write Capacity Units Alarm (across all tables)
    new cloudwatch.Alarm(this, 'DynamoDBWriteCapacityUnitsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ConsumedWriteCapacityUnits',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 18600 / 720, // 18600 per month, divided by 720 hours in a 30-day month
      evaluationPeriods: 24,
      alarmDescription: 'Alarm if DynamoDB write capacity units across all tables exceed 18600 per month',
    });

    // S3 Total Bucket Size Alarm (across all buckets)
    new cloudwatch.Alarm(this, 'S3TotalStorageAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: 'BucketSizeBytes',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 5 * 1024 * 1024 * 1024, // 5 GB in bytes
      evaluationPeriods: 24,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alarm if total S3 storage across all buckets exceeds 5 GB',
    });

    // API Gateway Requests Alarm (across all APIs)
    new cloudwatch.Alarm(this, 'ApiGatewayRequestsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Count',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 1000000 / 720, // 1 million per month, divided by 720 hours in a 30-day month
      evaluationPeriods: 24,
      alarmDescription: 'Alarm if API Gateway requests across all APIs exceed 1 million per month',
    });

    // CloudFront Data Transfer Alarm (across all distributions)
    new cloudwatch.Alarm(this, 'CloudFrontDataTransferAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: 'BytesDownloaded',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: (1024 * 1024 * 1024 * 1024) / 720, // 1 TB per month, divided by 720 hours in a 30-day month
      evaluationPeriods: 24,
      alarmDescription: 'Alarm if CloudFront data transfer across all distributions exceeds 1 TB per month',
    });

  }
}
