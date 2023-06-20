#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SpotifyServiceStack } from '../lib/spotify-service-stack';

const app = new cdk.App();
new SpotifyServiceStack(app, 'SpotifyServiceStack-dev', {
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  env: { account: '446708209687', region: 'us-west-2' },
  description: 'dev',
});


new SpotifyServiceStack(app, 'SpotifyServiceStack-prod', {
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  env: { account: '446708209687', region: 'us-west-2' },
  description: 'prod',
});