FROM ubuntu:bionic
ARG TARGETARCH
ENV TZ=Asia/Taipei
ENV container docker
SHELL ["/bin/bash", "-c"]
COPY tools/install.sh .
RUN TARGETARCH=${TARGETARCH} ./install.sh