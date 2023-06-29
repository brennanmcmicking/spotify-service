![Endpoint Badge](https://img.shields.io/endpoint?url=https%3A%2F%2Ff214m5bgqk.execute-api.us-west-2.amazonaws.com%2Fprod%2Fnow-playing%2Fbadge)

# Now Listening Service

This repo contains the CDK and function code to deploy a REST API hosted in AWS using API Gateway and Lambda. It returns what the user represented by the secrets stored in secrets manager is listening to in (near) real-time.

# Components

## CDK

The application infrastructure is defined in CDK. This makes it simple to manage infrastructure changes and use continuous integration.

## Lambda

The Lambda code is written in Python. It first refreshes its credentials with the Spotify API and retrieves a new access token. Access tokens last only one hour whereas refresh tokens (which is stored in Secrets Manager) lasts until a user de-authorizes the application from their account. After retrieving a new access token, it makes a request to the Spotify "Currently Playing" API endpoint and simplifies the response data before passing it back to API Gateway.

## API Gateway

API Gateway is used to route HTTP requests to the Lambda code. It has a cache of 10 seconds enabed. This should be just enough time to prevent people from spamming the API but also short enough to accurately depict what I'm listening to.

# Why?

I wanted to be able to embed a widget on my personal webpage (as well as theoretically anywhere where I can embed an IFrame) to display what I'm currently listening to on Spotify without having to publicize my Spotify API key.

# Usage

If you want to deploy this application yourself, it's actually pretty simple. These steps assume you have a firm grasp of AWS/cloud computing already:

1. Clone the repo
2. Create an AWS account
3. Add your credit card (this app uses non-free features like Secrets Manager and API Gateway caching)
4. Get an access key/secret key pair for your root account in the AWS console
5. Type `aws configure` locally and enter the creds as well as the region you want to use
6. Update the region in `spotify-service.ts` to match what you put in `aws configure`
7. Type `cdk bootstrap` in the repo you cloned
8. Go back to AWS, invalidate your creds, and add a role in IAM with the following policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": [
                "arn:aws:iam::*:role/cdk-*"
            ]
        }
    ]
}
```
9. Now get the access key/secret key pair for this role and do AWS configure again (this is just better security practice than always using the root user)
10. In Secrets Manager, put your Spotify client_id and client_secret as raw data in the following format: "client_id:client_secret" (example: "12345:67890")
11. Also create another secret for your refresh token. Getting your refresh token is really annoying but once you do it you never have to do it again. The steps to do it are available online, too much to write out here.
12. Once your secrets are in, copy their ARNs and put them in their respective locations in spotify-service-stack.ts
13. Set up a domain name, hosted zone, and certificate (cert must be in us-east-1) OR comment out the domain name mapping stuff in `spotify-service-stack.ts`
14. You should be ready to go! Type `cdk deploy --all` to deploy all stacks
15. Test your API (you can get the URL by going to API Gateway in the AWS console)