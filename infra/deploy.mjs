#!/usr/bin/env node
import 'source-map-support/register.js';
import * as cdk from 'aws-cdk-lib';
import { TriviaSnakeStack } from './TriviaSnakeStack.mjs';

const app = new cdk.App();
new TriviaSnakeStack(app, 'TriviaSnakeStackV2', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
