!/bin/sh

set -euxo pipefail

#docker build . -t 318142272849.dkr.ecr.ap-southeast-2.amazonaws.com/hacks-blog-rust:latest
#
#docker push 318142272849.dkr.ecr.ap-southeast-2.amazonaws.com/hacks-blog-rust:latest

docker build -t lambda_builder -f lambdaweb.Dockerfile .

docker run -t --rm -v ~/.cargo/registry:/root/.cargo/registry:z -v $(pwd):/build:z lambda_builder

serverless deploy --stage "prod"