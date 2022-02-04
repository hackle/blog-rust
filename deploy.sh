!/bin/sh

docker build . -t 318142272849.dkr.ecr.ap-southeast-2.amazonaws.com/hacks-blog-rust:latest

docker push 318142272849.dkr.ecr.ap-southeast-2.amazonaws.com/hacks-blog-rust:latest
