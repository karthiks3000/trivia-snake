import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
      userAttributes: {
        preferred_username: {
            required: true
        }
      }
    },
  },
  API: {
    GraphQL: {
      endpoint: process.env.REACT_APP_AWS_APPSYNC_GRAPHQL_ENDPOINT!,
      region: process.env.REACT_APP_AWS_REGION!,
      defaultAuthMode: 'userPool',
    }
  }
});
