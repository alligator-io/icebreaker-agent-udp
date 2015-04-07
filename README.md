# icebreaker-agent-udp
## Install
```bash
npm install icebreaker-agent-udp
```
## Example
```javascript
var _ = require('icebreaker')
require('icebreaker-peer-net')
require('icebreaker-msgpack')
require('icebreaker-agent-udp')

var peer =  _.peers.net({port:8986})

var muxrpc = require('muxrpc')

var api={}

var manifest = {
  hello: 'async'
}

var api = {}
api.hello=function(name,cb){
  cb(null,'hello '+name) 
}

peer.on('connection',function(connection){
  var rpc=muxrpc(manifest,manifest)(api)
  rpc.hello('world',function(err,message){
    if(err) throw err
    console.log(message)
  })
  _(connection,_.msgpack.decode(),rpc.createStream(),_.msgpack.encode(),connection)
})

peer.start()

var agent = _.agents.udp({peers:[peer]})
agent.once('started',function(){
  console.log('started')
})

agent.start()

```
## Licence
MIT
