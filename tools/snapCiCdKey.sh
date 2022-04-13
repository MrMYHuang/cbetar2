#!/bin/sh
snapcraft export-login credentials
openssl aes-256-cbc -e -in credentials -out .circleci/credentials.enc