## How to release flyback

1. Increment version `yarn release` or `yarn release -r 12.3.3` to release specific version 

1. Build flyback `yarn build`

1. Go to dist `cd dist`

1. Publish `git push --follow-tags origin master && npm publish`
