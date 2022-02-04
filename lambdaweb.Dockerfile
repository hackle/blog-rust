#!/usr/bin/env buildah bud --layers=true -t lambda_builder
FROM rust:1.58 as builder

WORKDIR /blog-rust

RUN apt-get update \
    && apt-get install -y zip \
    && rm -rf /var/lib/apt/lists/*

CMD cargo build --release --target-dir target_lambda && \
  size target_lambda/release/bootstrap && \
  ldd  target_lambda/release/bootstrap && \
  cd target_lambda/release && \
  cp -r ../../templates ./templates && \
  cp -r ../../static ./static && \
  cp -r ../../raw ./aw && \
  cp -r ../../Rocket.toml ./Rocket.toml && \
  zip -9 -r ./deploy.zip bootstrap static raw templates Rocket.toml

# FROM amazonlinux:2
# #
# # # Setup build environment
# # RUN mkdir -p /build/src && \
# #     yum update -y && \
# # # Add required packages
# #     yum install -y awscli gcc openssl-devel tree zip && \
# # # Install rust with rustup
# #     curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
#
# # Build environment setting
# WORKDIR /build
# ENV PATH=/root/.cargo/bin:/usr/sbin:/usr/bin:/sbin:/bin
# COPY --from=builder /blog-rust/target/release/blog-rust ${APP}/blog-rust

# Run container and build
#
# podman run -it --rm -v ~/.cargo/registry:/root/.cargo/registry:z -v .:/build:z lambda_builder
#