import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
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
        callbackUrls: allowedURLs,
        logoutUrls: allowedURLs,
      },
    });

    // AppSync API
    const appSyncApi = new appsync.GraphqlApi(this, 'TriviaSnakeAppSyncAPI', {
      name: 'trivia-snake-app-sync-api',
      definition: appsync.Definition.fromFile(path.join(__dirname, '..', 'src', 'graphql', 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: cdk.Expiration.after(cdk.Duration.days(365))
            }
          },
          {
            authorizationType: appsync.AuthorizationType.IAM,
          },
        ],
      },
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_WEEK
      },
    });

    // DynamoDB Tables
    const gameSessionTable = new dynamodb.Table(this, 'TriviaSnakeGameSession', {
      tableName: 'TriviaSnakeGameSession',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const adventureTable = new dynamodb.Table(this, 'TriviaSnakeAdventure', {
      tableName: 'TriviaSnakeAdventure',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const leaderboardTable = new dynamodb.Table(this, 'TriviaSnakeLeaderboardV2', {
      tableName: 'TriviaSnakeLeaderboardV2',
      partitionKey: { name: 'userId_adventureId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'score', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSIs
    gameSessionTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'sessionStatus', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    leaderboardTable.addGlobalSecondaryIndex({
      indexName: 'adventure-score-index',
      partitionKey: { name: 'adventureId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'score', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create AppSync DataSources
    const gameSessionDS = appSyncApi.addDynamoDbDataSource('GameSessionDataSource', gameSessionTable);

    // Create Lambda function for custom resolvers
    const resolverFunction = new lambda.Function(this, 'ResolverFunction', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'game-logic')),
      environment: {
        GAME_SESSIONS_TABLE: gameSessionTable.tableName,
        ADVENTURES_TABLE: adventureTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        nodeModules: [
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/lib-dynamodb'
        ]
      },
      timeout: cdk.Duration.seconds(30)
    });

    // Grant permissions
    gameSessionTable.grantReadWriteData(resolverFunction);
    adventureTable.grantReadWriteData(resolverFunction);
    leaderboardTable.grantReadWriteData(resolverFunction);

    // Create Lambda DataSource
    const lambdaDS = appSyncApi.addLambdaDataSource('LambdaDataSource', resolverFunction);

    // Create Resolvers
    // Query Resolvers

    gameSessionDS.createResolver('GetGameSessionResolver', {
      typeName: 'Query',
      fieldName: 'getGameSession',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('id', 'id'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    gameSessionDS.createResolver('ListGameSessionsResolver', {
      typeName: 'Query',
      fieldName: 'listGameSessions',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Scan",
          "limit": $util.defaultIfNull($ctx.args.limit, 20),
          "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null))
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.error)
          $util.error($ctx.error.message, $ctx.error.type)
        #end
        
        #if($ctx.result.items.size() == 0)
          #return({
            "items": [],
            "nextToken": $util.toJson($util.defaultIfNull($ctx.result.nextToken, null))
          })
        #end
    
        $util.toJson({
          "items": $ctx.result.items,
          "nextToken": $util.defaultIfNull($ctx.result.nextToken, null)
        })
      `)
    });

    // Mutation Resolvers
    lambdaDS.createResolver('CreateGameSessionResolver',{
      typeName: 'Mutation',
      fieldName: 'createGameSession',
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDS.createResolver('JoinGameSessionResolver', {
      typeName: 'Mutation',
      fieldName: 'joinGameSession',
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });


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
      timeout: cdk.Duration.minutes(1)
    });

    leaderboardTable.grantReadWriteData(leaderboardFunction);
    adventureTable.grantReadWriteData(leaderboardFunction);
    adventureImagesBucket.grantReadWrite(leaderboardFunction);

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
    // Grant permissions to call Amazon Bedrock
    leaderboardFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:ListFoundationModels',
      ],
      resources: ['*'], // You might want to restrict this to specific model ARNs if known
    }));

    // Create REST API
    const restApi = new apigateway.RestApi(this, 'TriviaSnakeRestApi', {
      restApiName: 'Trivia Snake REST API',
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
    const leaderboardResource = restApi.root.addResource('leaderboard');
    const adventuresResource = restApi.root.addResource('adventures');
    const adventureIdResource = adventuresResource.addResource('{id}');
    const generateQuizResource = restApi.root.addResource('generate-quiz');
    
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

    // Add outputs
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: appSyncApi.graphqlUrl,
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: appSyncApi.apiKey || '',
    });

    new cdk.CfnOutput(this, 'RestApiEndpoint', {
      value: restApi.url,
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
    });
  }
}
