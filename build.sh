!/bin/sh

set -euxo pipefail

docker build -t lambda_builder -f lambdaweb.Dockerfile .

docker run -t --rm -v ~/.cargo/registry:/root/.cargo/registry:z -v $(pwd):/build:z lambda_builder