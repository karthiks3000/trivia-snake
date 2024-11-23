// lambda/websocket/authorizer.ts
import { 
    APIGatewayRequestAuthorizerHandler, 
    APIGatewayAuthorizerResult,
    APIGatewayRequestAuthorizerEvent 
  } from 'aws-lambda';
  import { CognitoJwtVerifier } from "aws-jwt-verify";
  
  const USER_POOL_ID = process.env.USER_POOL_ID!;
  const CLIENT_ID = process.env.CLIENT_ID!;
  
  const verifier = CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    tokenUse: "access",
    clientId: CLIENT_ID,
  });
  
  export const handler: APIGatewayRequestAuthorizerHandler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    try {
      // The token is passed in the query parameters for WebSocket connections
      const token = event.queryStringParameters?.token;
  
      if (!token) {
        throw new Error('No authorization token provided');
      }
  
      // Verify the JWT token
      const payload = await verifier.verify(token);
  
      // Ensure context values are strings
      const authResponse: APIGatewayAuthorizerResult = {
        principalId: payload.sub,
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: event.methodArn
            }
          ]
        },
        context: {
          userId: payload.sub,
          username: String(payload['cognito:username'] || ''),
          email: String(payload.email || '')
        }
      };
  
      return authResponse;
    } catch (error) {
      console.error('Authorization failed:', error);
      throw new Error('Unauthorized');
    }
  };
  