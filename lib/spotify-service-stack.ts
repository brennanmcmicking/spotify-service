import * as cdk from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

const SECRET_ARN = "arn:aws:secretsmanager:us-west-2:446708209687:secret:spotify/refresh-token-FetKWZ";

export class SpotifyServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const stage = props?.description;

    const secret = Secret.fromSecretCompleteArn(this, "SpotifyRefreshToken", "arn:aws:secretsmanager:us-west-2:446708209687:secret:spotify/refresh-token-FetKWZ");

    const handler = new Function(this, `NowPlayingHandler-${stage}`, {
      runtime: Runtime.PYTHON_3_10,
      code: Code.fromAsset("resources"),
      handler: "nowplaying.handler",
      environment: {
        REFRESH_TOKEN: SECRET_ARN,
      }
    });

    secret.grantRead(handler);

    const api = new LambdaRestApi(this, `NowPlayingApi-${stage}`, {
      handler,
      proxy: false,
    });

    const now_playing = api.root.addResource("now-playing");
    now_playing.addMethod('GET');
  }
}
