#!/bin/bash

echo 'clean files...'
rm -rf ./build/*

mkdir -p ./build/print_files
mkdir -p ./build/tmp
cp -r biz ./build
cp -r core ./build
cp -r docs ./build
cp -r routers ./build
cp -r views ./build
cp -r sbin ./build
cp *.js ./build
cp package.json ./build
cp README.md ./build

echo 'build done.'
