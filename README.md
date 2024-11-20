# Trivia Snake

A web-based trivia game application built with React and AWS serverless infrastructure.

## Project Overview

This project is a full-stack application that consists of:
- Frontend: React application with TypeScript
- Backend: AWS Lambda functions
- Infrastructure: AWS CDK for deployment
- Real-time Communication: WebSocket API
- Database: DynamoDB
- Authentication: AWS Amplify
- AI: AWS Bedrock (Claude 3.5 Haiku)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or later)
- npm (Node Package Manager)
- AWS CLI
- AWS CDK CLI
- An AWS account with appropriate credentials configured

## Project Structure

```
├── infra/                  # AWS CDK infrastructure code
│   ├── TriviaSnakeStack.mjs   # Main stack definition
│   └── deploy.mjs         # CDK deployment script
├── lambda/                 # Lambda function source code
├── src/                    # React application source code
├── public/                 # Static files
└── package.json           # Project dependencies and scripts
```

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd trivia-snake
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   Create `.env.development` for local development:
   ```
   REACT_APP_API_ENDPOINT=<your-api-endpoint>
   REACT_APP_WS_ENDPOINT=<your-websocket-endpoint>
   ```

4. Start the development server:
   ```bash
   npm start
   ```
   The application will be available at http://localhost:3000

## AWS Deployment

### First-time Setup

1. Install and configure AWS CLI:
   ```bash
   aws configure
   ```
   Enter your AWS credentials when prompted.

2. Bootstrap AWS CDK (first-time only):
   ```bash
   cd infra
   cdk bootstrap
   ```

### Deployment Steps

1. Deploy the infrastructure:
   ```bash
   npm run deploy:infra
   ```
   This command will:
   - Deploy all AWS resources (Lambda functions, API Gateway, DynamoDB tables, etc.)
   - Create necessary IAM roles and permissions
   - Set up API endpoints

2. Build and deploy the frontend:
   ```bash
   # First, update the S3 bucket name in package.json deploy:frontend script
   # Then run:
   npm run deploy:frontend
   ```

3. Alternative: Deploy everything at once:
   ```bash
   npm run deploy
   ```

### Post-deployment

After deployment:
1. Note the outputted CloudFront distribution URL or API Gateway endpoint
2. Update your environment variables with the new endpoints
3. Update the cloudformation stack variable `allowedURLs` to include the cloudfront url
3. Test the application through the provided URL

## Available Scripts

- `npm start`: Run the application locally
- `npm run build`: Build the application for production
- `npm test`: Run the test suite
- `npm run deploy:infra`: Deploy AWS infrastructure
- `npm run deploy:frontend`: Deploy frontend to S3
- `npm run deploy`: Deploy both infrastructure and frontend

## Required AWS Services

The application uses the following AWS services:
- Amazon S3 (for hosting the frontend)
- AWS Lambda (for serverless backend functions)
- Amazon DynamoDB (for data storage)
- Amazon API Gateway (for REST and WebSocket APIs)
- AWS CloudFront (for content delivery)
- AWS Amplify (for authentication)

## Troubleshooting

Common issues and solutions:

1. AWS Credentials
   - Ensure AWS credentials are properly configured in ~/.aws/credentials
   - Verify you have sufficient permissions in your AWS account
   - Required permissions include:
     * CloudFormation full access
     * IAM role creation
     * Lambda function deployment
     * S3 bucket creation and management
     * API Gateway management
     * DynamoDB table creation

2. CDK Deployment Issues
   - Run `cdk diff` to see pending changes
   - Check CloudFormation console for detailed error messages
   - Common errors:
     * Missing environment variables
     * Insufficient IAM permissions
     * Name conflicts with existing resources

3. Frontend Deployment
   - Verify S3 bucket name in package.json
   - Ensure built files are generated in the build/ directory
   - Check CORS configuration if API calls fail
   - Verify environment variables are correctly set

## Security Considerations

- Keep your AWS credentials secure and never commit them to the repository
- Use environment variables for sensitive configuration
- Review and adjust IAM roles and permissions as needed
- Enable CloudFront HTTPS-only access
- Implement proper authentication and authorization
- Regular security audits and updates

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [React Documentation](https://reactjs.org/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Amazon DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS Amplify Authentication Guide](https://docs.amplify.aws/)