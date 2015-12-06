var test = require('tape')

var Agent =require('./')

var agent
var localAgent
var remoteAgent

test('start agents', function (t) {
  t.plan(2)

  localAgent = Agent({
    port: 8886,
    loopback:true
  })

  remoteAgent = Agent({
    port: 8886,
    loopback:true

  })

  localAgent.once('started', t.ok.bind(null, true, 'local agent started'))
  localAgent.start()

  remoteAgent.once('started', t.ok.bind(null, true, 'remote agent started'))
  remoteAgent.start()
})

test('request/response',function(t){
  t.plan(2)
  remoteAgent.on('response',function(msg){
    if(msg.type=='ping'){
      t.equal(msg.type,'ping');

      remoteAgent.emit('request',{type:'pong'});
    }
  });
    localAgent.on('response',function(msg){
    if(msg.type=='pong'){
      t.equal(msg.type,'pong');
      t.end();
    }
  });
  localAgent.emit('request',{type:'ping'});
});

test('stop agents', function (t) {
  t.plan(2)
  localAgent.once('stopped', t.ok.bind(null, true, 'local agent stopped'))
  localAgent.stop()
  remoteAgent.once('stopped', t.ok.bind(null, true, 'remote agent stopped'))
  remoteAgent.stop()
})
