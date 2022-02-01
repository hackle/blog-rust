FROM rust:1.58 as builder

RUN USER=root cargo new --bin blog-rust
WORKDIR ./blog-rust
ADD . .
RUN cargo build --release

FROM debian:buster-slim
ARG APP=/usr/src/app

RUN apt-get update \
    && apt-get install -y ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 80

ENV TZ=Etc/UTC
ENV APP_USER=appuser

RUN groupadd $APP_USER \
    && useradd -g $APP_USER $APP_USER \
    && mkdir -p ${APP}

COPY --from=builder /blog-rust/target/release/blog-rust ${APP}/blog-rust
COPY --from=builder /blog-rust/static ${APP}/static
COPY --from=builder /blog-rust/raw ${APP}/raw
COPY --from=builder /blog-rust/templates ${APP}/templates
COPY --from=builder /blog-rust/Rocket.toml ${APP}/Rocket.toml

RUN chown -R $APP_USER:$APP_USER ${APP}

USER $APP_USER
WORKDIR ${APP}

CMD ["./blog-rust"]