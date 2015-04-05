var _ = require('icebreaker')
if(!_.agent)require('icebreaker-agent')

var createSocket = require('broadcast-stream')

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
    looback:false,
    peers:[],
    start: function () {
      this.server = createSocket(this.port)
      var self = this
      var onListening = function () {
        if (this.timer == null)
          this.timer = setInterval(function () {
            _(
              isFunction(this.peers)?this.peers():this.peers,
              _.drain(function (peer) {
                if (peer && (peer.enabled==null||peer.enabled === true) && peer.auto) {
                  var message = JSON.stringify({
                    port: peer.port,
                    name: peer.name
                  })
                  this.server.write(message)
                }
              }.bind(this)))
          }.bind(this), this.interval)

        this.emit('started')

      }.bind(this)

      var onData = function (msg) {
        if (msg.loopback &&  self.looback===false) {
          return
        }

        try {
          var message = JSON.parse(msg)
          message.port = message.port || msg.port
          message.address = msg.address
          var c = require('cluster')
          _([message], self.connect())
        } catch (err) {
          _([err], _.log(null, 'error'))
        }
      }

      this.server.on('data', onData)

      var onStop = function () {
        this.server.removeListener('listening', onListening)
        this.removeListener('stopped', onStop)
        this.server.removeListener('data', onData)
      }.bind(this)

      this.on('stop', onStop)
      this.server.on('listening', onListening)

    },
    stop: function () {
      if (this.timer != null) {
        clearInterval(this.timer)
        this.timer = null
        this.server.end()
      }
      this.emit('stopped')
    }
  })
}, _.agents)
