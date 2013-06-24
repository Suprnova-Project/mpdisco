(function() {
  var Class = require('clah'),
      EventEmitter = require('events').EventEmitter,
      _ = require('underscore');
  
  var ClientsManager = Class.extend(_.extend(EventEmitter.prototype, {
    init: function() {
      this.clients = [];
      
      this.clientsHash = {};
      
      this.disconnectionTimeouts = {};
    },
    connected: function(client) {
      var that = this;
      
      //Useful to know when someone connects
      console.log('\t socket.io:: client ' + client.userid + ' connected');
      
      if (this.clientsHash[client.userid]) {
        
        this.clients[this.clients.indexOf(client)] = client;
        
        console.log('client returned ' + client.userid);
        
      } else {
        
        this.clients.push(client);
        
      }
      
      this.clientsHash[client.userid] = client;
      
      this.disconnectionTimeouts[client.userid] && clearTimeout(this.disconnectionTimeouts[client.userid]);
      
      //When this client disconnects
      client.on('disconnect', function() {
    
        that.disconnected.call(that, client);
    
      });
      //client.on disconnect
      
      this.emit('connected', client);
    },
    disconnected: function(client) {
      
      console.log('\t socket.io:: client disconnected ' + client.userid);
      console.log('client has 5 seconds to return');
      
      this.disconnectionTimeouts[client.userid] = setTimeout(function() {
        
        client.broadcast.emit('clientdisconnected', client.userid);
        
        this.dropClient(client);
        
        this.emit('disconnected', client);
        
      }.bind(this), 5000);
      
    },
    dropClient: function(client) {      
      var index = _.find(this.clients, function(c) { return c.userid === client.userid; });
      
      console.log('Dropped client ' + client.userid);
      
      this.clients.splice(index, 1);
      
      delete this.clientsHash[client.userid];
    },
    get: function(userid) {
      return this.clientsHash[userid];
    },
    first: function() {
      if (this.clients.length) {
        return this.clients[0];
      }
    },
    rotate: function() {
      this.clients.push(this.clients.shift());
    },
    isEmpty: function() {
      return this.clients.length <= 0;
    },
    clientIds: function() {
      return _.map(this.clients, function(v) { return v.userid; });
    }
  }));
  
  var ClientsManagerSingleton = function() {
    if ( ClientsManagerSingleton.prototype._singletonInstance ) {
      return ClientsManagerSingleton.prototype._singletonInstance;
    }
    
    return (ClientsManagerSingleton.prototype._singletonInstance = new ClientsManager); 
  };
  
  if (this.define && define.amd) {
    // Publish as AMD module
    define(function() {
      return ClientsManagerSingleton;
    });
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = ClientsManagerSingleton;
  }
})();