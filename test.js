var test = require('tape')

var _ = require('icebreaker')
require('icebreaker-peer-net')
require('./')

var localPeers = {}
var remotePeers = {}
var connections = []

test('start peers', function (t) {
  t.plan(30)

  for (var i = 0; i < 10; ++i) {
    var peer = _.peers.net({
      port: '568' + i,
      name: 'net'
    })

    peer.once('started', function (port, i) {
      return function () {
        t.equals(this.name, 'net')
        i % 2 ? localPeers[this.name + i] = this :
          remotePeers[this.name + i] = this
        t.equals(this.port, port)
        t.ok(true, 'peer net' + i + ' started')
      }
    }('568' + i, i))

    peer.on('connection', function (c) {
      connections.push(c)

    })

    peer.once('stop', function () {
      return function () {
        delete localPeers[this.name + i]
        delete remotePeers[this.name + i]
      }
    }(i))

    peer.start()
  }
})

var agent
var localAgent
var remoteAgent

test('start agents', function (t) {
  t.plan(2)

  localAgent = _.agents.udp({
    peers: localPeers,
    address:'127.0.0.1',
    multicast:false,
    unicast:'127.0.0.2',
    port: 8886,
    loopback: true
  })

  remoteAgent = _.agents.udp({
    peers: remotePeers,
    port: 8886,
    address:'127.0.0.2',
    multicast:false,
    unicast:'127.0.0.1',
    loopback: true
  })

  localAgent.once('started', t.ok.bind(null, true, 'local agent started'))
  localAgent.start()

  remoteAgent.once('started', t.ok.bind(null, true, 'remote agent started'))
  remoteAgent.start()
})

test('connections', function (t) {
  t.plan(11)

  var timer = setInterval(function () {
    if (connections.length < 20) return
    clearInterval(timer)
    t.equal(connections.length, 20)

    for (var i in connections) {
      var connection = connections[i]
      if (connection.direction === 1) {
        _('test1', connection, _.drain(function (item) {
          t.equal(item.toString(), 'echotest1')
        }))
      }
      else _(
        connection,
        _.map(function (m) {
          return 'echo' + m.toString()
        }),
        connection
      )
    }
  }, 500)

})

test('stop peers', function (t) {
  t.plan(10)
  for (var i in localPeers) {
    var peer = localPeers[i]
    peer.once('stopped', t.ok.bind(null, true, 'local peer ' + i + ' stopped'))
    peer.stop()
  }
  for (var i in remotePeers) {
    var peer = remotePeers[i]
    peer.once('stopped', t.ok.bind(null, true, 'remote peer ' + i + ' stopped'))
    peer.stop()
  }
})

test('stop agents', function (t) {
  t.plan(2)
  localAgent.once('stopped', t.ok.bind(null, true, 'local agent stopped'))
  localAgent.stop()
  remoteAgent.once('stopped', t.ok.bind(null, true, 'remote agent stopped'))
  remoteAgent.stop()
})
