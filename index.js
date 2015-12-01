var _ = require('icebreaker')
var Agent = require('icebreaker-agent')

var createSocket = require('datagram-stream')

function AgentUdp(params) {
  if (!(this instanceof AgentUdp)) return new AgentUdp(params);

  var self = this
  var socket

  Agent.call(this, {
    name: 'udp',
    port: 8999,
    interval: 1000,
    loopback: false,
    peers: [],
    multicast: '239.5.5.5',
    unicast: null,

    start: function () {
      if (!socket) socket = createSocket({
          address: this.address,
          multicast: this.multicast,
          port: this.port,
          reuseAddr: true,
          unicast: this.unicast,
          loopback: this.loopback
        },
        function (err) {
          if (err) throw err
          var self = this;

          function onRequest(msg) {
            socket.write(JSON.stringify(msg))
          }

          this.on('request', onRequest);

          function onData(msg) {
            try {
              var message = JSON.parse(msg)
              message.address = msg.rinfo.address;
              message.port = message.port || msg.rinfo.port
              self.emit('response', message);
            } catch (err) {
              _([err], _.log(null, 'error'))
            }
          }

          socket.on('data', onData)
          var onStop = function () {
            this.removeListener('request', onRequest)
            this.removeListener('stopped', onStop)
            socket.removeListener('data', onData)
            socket.end()
          }.bind(this)

          this.on('stop', onStop)
          this.emit('started')
        }.bind(this))
    },
    stop: function () {
      this.emit('stopped')
    }
  }, params)
}

var proto = AgentUdp.prototype = Object.create(Agent.prototype)
module.exports = proto.constructor = AgentUdp
