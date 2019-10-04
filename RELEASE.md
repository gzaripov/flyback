## How to release flyback

1. Increment version `yarn release` or `yarn release -r 3.0.0` to release specific version 

1. Build flyback `yarn build`

1. Go to dist `cd dist`

1. Publish `git push --follow-tags origin master && npm publish`

1. Build docker image: `cd docker && docker build -t gzaripov/flyback:3.0.0  -f Dockerfile .`

1. Publish docker image to hub `docker push gzaripov/flyback:3.0.0`
