#!/usr/bin/env bash
# Starts a 3-member local replica set (rs0) on ports 27017-27019 for development/demo. Requires mongod + mongosh on PATH.
set -euo pipefail
BASE="${REPLSET_DIR:-$HOME/parkease-rs}"
for p in 27017 27018 27019; do
  mkdir -p "$BASE/$p"
  mongod --replSet rs0 --port "$p" --bind_ip 127.0.0.1 --dbpath "$BASE/$p" --logpath "$BASE/$p/mongod.log" --fork --pidfilepath "$BASE/$p/mongod.pid"
done
sleep 3
mongosh --port 27017 --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"},{_id:1,host:"127.0.0.1:27018"},{_id:2,host:"127.0.0.1:27019"}]})'
echo 'Use: MONGODB_URI=mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/parkease?replicaSet=rs0'
