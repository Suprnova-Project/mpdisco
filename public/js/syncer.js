/*! mpdisco 2014-06-26 */
define(["class","underscore","mpdisco"],function(a,b,c){var d=a.extend({init:function(){c.network.on("update",this.update.bind(this))},update:function(a){var d=this.commands[a];if(d)return b.isFunction(d)?void d(c.network):b.isArray(d)?void b.each(d,this.execute):void this.execute(d)},execute:function(a){var d=a,e=null;b.isObject(a)&&a.command&&(d=a.command,e=a.args),c.command(d,e)},commands:{connected:["currentsong","status","playlistinfo"],playlist:"playlistinfo",database:{command:"list",args:"artist"},player:["currentsong","status"],options:["status"]}});return c.Syncer=d,c.syncer=new d,d});