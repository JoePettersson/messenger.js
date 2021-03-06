var ERR_REQ_REFUSED, MessengerBase, Speaker, net,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

net = require('net');

MessengerBase = require('./messengerBase');

ERR_REQ_REFUSED = -1;

Speaker = (function(_super) {

  __extends(Speaker, _super);

  function Speaker(addresses) {
    var address, _i, _len, _ref;
    this.sockets = [];
    this.waiters = {};
    this.socketIterator = 0;
    _ref = this.arrayAddresses(addresses);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      address = _ref[_i];
      this.connect(address);
    }
  }

  Speaker.prototype.connect = function(address) {
    var host, port, socket,
      _this = this;
    host = this.getHostByAddress(address);
    port = this.getPortByAddress(address);
    socket = new net.Socket;
    socket.setEncoding('utf8');
    socket.setNoDelay(true);
    socket.setMaxListeners(Infinity);
    socket.connect(port, host, function() {
      return _this.sockets.push(socket);
    });
    socket.on('data', function(data) {
      var message, messageText, _i, _len, _ref, _results;
      _ref = _this.tokenizeData(data);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        messageText = _ref[_i];
        message = JSON.parse(messageText);
        if (!_this.waiters[message.id]) continue;
        _this.waiters[message.id](message.data);
        _results.push(delete _this.waiters[message.id]);
      }
      return _results;
    });
    socket.on('end', function() {
      return socket.connect(port, host);
    });
    return socket.on('error', function() {
      return socket.connect(port, host);
    });
  };

  Speaker.prototype.request = function(subject, data, callback) {
    var messageId, payload;
    if (this.sockets.length === 0) {
      return callback({
        error: ERR_REQ_REFUSED
      });
    }
    if (!this.sockets[this.socketIterator]) this.socketIterator = 0;
    messageId = this.generateUniqueId();
    payload = this.prepareJsonToSend({
      id: messageId,
      subject: subject,
      data: data
    });
    this.waiters[messageId] = callback;
    return this.sockets[this.socketIterator++].write(payload);
  };

  Speaker.prototype.shout = function(subject, data) {
    var payload, socket, _i, _len, _ref, _results;
    payload = {
      subject: subject,
      data: data
    };
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.write(this.prepareJsonToSend(payload)));
    }
    return _results;
  };

  Speaker.prototype.arrayAddresses = function(addresses) {
    if (addresses instanceof Array) return addresses;
    return [addresses];
  };

  return Speaker;

})(MessengerBase);

module.exports = Speaker;
