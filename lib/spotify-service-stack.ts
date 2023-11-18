import * as cdk from "aws-cdk-lib";
import {
  Deployment,
  LambdaIntegration,
  Resource,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

const REFRESH_TOKEN_ARN =
  "arn:aws:secretsmanager:us-west-2:446708209687:secret:spotify/refresh-token-FetKWZ";
const CLIENT_SECRET_ARN =
  "arn:aws:secretsmanager:us-west-2:446708209687:secret:spotify/client-secret-XZfhGY";

export class SpotifyServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const stage = props?.description;
    const isTest = stage !== "prod";

    const refresh_secret = Secret.fromSecretCompleteArn(
      this,
      "SpotifyRefreshToken",
      REFRESH_TOKEN_ARN
    );
    const client_secret = Secret.fromSecretCompleteArn(
      this,
      "SpotifyClientSecret",
      CLIENT_SECRET_ARN
    );

    const handler = new Function(this, `NowPlayingHandler-${stage}`, {
      runtime: Runtime.PYTHON_3_10,
      code: Code.fromAsset("resources"),
      handler: "nowplaying.handler",
      environment: {
        REFRESH_TOKEN_ARN,
        CLIENT_SECRET_ARN,
      },
    });

    refresh_secret.grantRead(handler);
    client_secret.grantRead(handler);

    const api = RestApi.fromRestApiAttributes(this, `RestApi-${stage}`, {
      restApiId: cdk.Fn.importValue(`ApiGatewayId${stage}`),
      rootResourceId: cdk.Fn.importValue(`ApiGatewayRootId${stage}`),
    });

    // const resource = api.root.getResource("spotify");

    const resource = Resource.fromResourceAttributes(
      this,
      `Resource-${stage}`,
      {
        resourceId: cdk.Fn.importValue(`SpotifyResource${stage}`),
        restApi: api,
        path: "/spotify",
      }
    );

    const now_playing = resource.addResource("now-playing");
    const now_playing_method = now_playing.addMethod(
      "GET",
      new LambdaIntegration(handler),
      {
        apiKeyRequired: isTest,
      }
    );

    const now_playing_badge = resource.addResource("badge");
    const now_playing_badge_method = now_playing_badge.addMethod(
      "GET",
      new LambdaIntegration(handler),
      {
        apiKeyRequired: isTest,
      }
    );

    // idk if this actually does something, guess we'll have to test if i ever add another integration
    // message to future me: you'll likely have to go to the console and click "deploy API" on API Gateway
    const deployment = new Deployment(this, `SpotifyApiDeployment-${stage}`, {
      api,
      retainDeployments: false,
    });

    deployment._addMethodDependency(now_playing_method);
    deployment._addMethodDependency(now_playing_badge_method);
  }
}
