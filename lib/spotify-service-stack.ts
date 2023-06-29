import * as cdk from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

const REFRESH_TOKEN_ARN = "arn:aws:secretsmanager:us-west-2:446708209687:secret:spotify/refresh-token-FetKWZ";
const CLIENT_SECRET_ARN = "arn:aws:secretsmanager:us-west-2:446708209687:secret:spotify/client-secret-XZfhGY";

export class SpotifyServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const stage = props?.description;
    const isTest = stage !== 'prod';

    const refresh_secret = Secret.fromSecretCompleteArn(this, "SpotifyRefreshToken", REFRESH_TOKEN_ARN);
    const client_secret = Secret.fromSecretCompleteArn(this, "SpotifyClientSecret", CLIENT_SECRET_ARN);

    const handler = new Function(this, `NowPlayingHandler-${stage}`, {
      runtime: Runtime.PYTHON_3_10,
      code: Code.fromAsset("resources"),
      handler: "nowplaying.handler",
      environment: {
        REFRESH_TOKEN_ARN,
        CLIENT_SECRET_ARN,
      }
    });

    refresh_secret.grantRead(handler);
    client_secret.grantRead(handler);

    const api = new LambdaRestApi(this, `NowPlayingApi-${stage}`, {
      handler,
      proxy: false,
      deployOptions: {
        cachingEnabled: true,
        cacheClusterEnabled: true,
        cacheDataEncrypted: true,
        stageName: "prod",
        dataTraceEnabled: true,
        cacheTtl: cdk.Duration.seconds(10),
        throttlingBurstLimit: 10,
        throttlingRateLimit: 10,
      },
      // domainName: {
      //   domainName: (isTest ? 'devapi' : 'api') + '.brennanmcmicking.net',
      //   certificate: Certificate.fromCertificateArn(this, `Cert-${stage}`,
      //     'arn:aws:acm:us-east-1:446708209687:certificate/5604dec6-3562-4132-b3f0-43129bbbf466'),
      //   basePath: 'v1',
      //   endpointType: EndpointType.EDGE,
      // }
    });

    const now_playing = api.root.addResource("now-playing");
    now_playing.addMethod('GET');

    // const hostedZone = HostedZone.fromHostedZoneAttributes(this, `HostedZone-${stage}`, {
    //   hostedZoneId: 'Z045204614CI9B8AAMLRQ',
    //   zoneName: 'brennanmcmicking.net',
    // });

    // new ARecord(this, `ARecord-${stage}`, {
    //   zone: hostedZone,
    //   recordName: 'api',
    //   target: RecordTarget.fromAlias(new ApiGateway(api)),
    // });
  }
}
