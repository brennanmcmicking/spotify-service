import os
import json
import base64
import datetime

import urllib3
http = urllib3.PoolManager()
import botocore 
import botocore.session 
# from aws_secretsmanager_caching import SecretCache, SecretCacheConfig 

secrets_client = botocore.session.get_session().create_client('secretsmanager')
# cache_config = SecretCacheConfig()
# cache = SecretCache( config = cache_config, client = client)

ACCOUNTS_URL = "https://accounts.spotify.com/api/token"
API_URL = "https://api.spotify.com/v1/me/player/currently-playing"

REFRESH_TOKEN = secrets_client.get_secret_value(SecretId=os.environ['REFRESH_TOKEN_ARN'])["SecretString"]
CLIENT_SECRET = base64.b64encode(secrets_client.get_secret_value(SecretId=os.environ['CLIENT_SECRET_ARN'])["SecretString"].encode('ascii')).decode('ascii')
print("Refreshed secrets")


def refreshAccessToken():
  res = http.request("POST", ACCOUNTS_URL, 
    headers={
      'Authorization': f'Basic {CLIENT_SECRET}',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body=f"grant_type=refresh_token&refresh_token={REFRESH_TOKEN}"
  )
  print(res.data)
  return json.loads(res.data)["access_token"]


access_token = refreshAccessToken()
access_token_last_update = datetime.datetime.now()
print("Got first access token")


def handler(event, context):
  global access_token
  global access_token_last_update
  if access_token is None or datetime.datetime.now() - access_token_last_update > datetime.timedelta(minutes=59):
    access_token = refreshAccessToken()
    access_token_last_update = datetime.datetime.now()
    print("Refreshed access token")

  headers = {
    'Authorization': f'Bearer {access_token}'
  }

  r = http.request('GET', API_URL, headers=headers)

  if r.status == 200:
    resJson = json.loads(r.data)
    print(resJson)
    progress = resJson["progress_ms"]
    duration = resJson["item"]["duration_ms"]
    album_name = resJson["item"]["album"]["name"]
    artists_raw = resJson["item"]["artists"]
    artists = []
    for artist_raw in artists_raw:
      artists.append(artist_raw["name"])
    name = resJson["item"]["name"]
    return {
          "statusCode": 200,
          "body": json.dumps({
            "progress": progress,
            "duration": duration,
            "album_name": album_name,
            "artists": artists,
            "song_name": name
          }),
      }
  else:
    return {
      "statusCode": r.status
    }