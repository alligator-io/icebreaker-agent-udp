var _ = require('icebreaker')
if (!_.agent) require('icebreaker-agent')

var createSocket = require('datagram-stream')

function isFunction(obj) {
  return typeof obj === 'function'
}

if (!_.agents) _.mixin({
  agents: {}
})

_.mixin({
  udp: _.agent({
    name: 'udp',
    port: 8999,
    interval: 1000,
    loopback: false,
    peers: [],
    multicast: '239.5.5.5',

    start: function () {
      var self = this

      this.server = createSocket({
        address: this.address,
        multicast: this.multicast,
        port: this.port,
        reuseAddr: true,
        loopback: this.loopback
      })

      function onData(msg) {
        try {
          var message = JSON.parse(msg)
          message.port = message.port || msg.rinfo.port
          _(
            isFunction(self.peers) ? self.peers() :_.values(self.peers),
            _.find(function(p){
              return message.name === p.name && p.auto === true
            },
            function(err,found){
              if(err)return _([err], _.log(null, 'error'))
              if(found)_([message], self.connect())
            })
          )

        }
        catch (err) {
          _([err], _.log(null, 'error'))
        }
      }

      this.server.on('data', onData)

      var onStop = function () {
        this.removeListener('stopped', onStop)
        this.server.removeListener('data', onData)
        this.server.end()
      }.bind(this)

      this.on('stop', onStop)

      if (this.timer == null)
        this.timer = setInterval(function () {
          _(
            _.values(isFunction(this.peers) ? this.peers() : this.peers),
            _.drain(function (peer) {
              if (peer && (peer.enabled == null || peer.enabled === true)) {
                self.server.write(JSON.stringify({
                  port: peer.port,
                  name: peer.name,
                  address: peer.address
                }))
              }
            })
          )
        }.bind(this), this.interval)

      this.emit('started')

    },

    stop: function () {
      if (this.timer != null) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.emit('stopped')
    }
  })
}, _.agents)
