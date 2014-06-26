/*! mpdisco 2014-06-26 */
define(["mpdisco","handlebars"],function(a){var b=a.module("Player",function(a,b,c,d){a.Song=b.Model.extend({initialize:function(){this.listenTo(this,"change:album",function(){this.set("coverart",this.defaults.coverart)})},defaults:{title:"",artist:"",album:"",coverart:"http://placehold.it/150x150",time:"0:0"},socketEvents:{status:"set",currentsong:"set",coverart:"set"},set:function(a){a.time&&-1===a.time.indexOf(":")&&delete a.time,b.Model.prototype.set.apply(this,arguments)}}),b.current=new a.Song,a.PlayerView=d.ItemView.extend({template:"player",className:"player",model:b.current,modelEvents:{change:"updatePlayer","change:title":"render","change:time":"updateTimer","change:coverart":"updateCoverArt"},events:{"click .prev":"prevSong","click .next":"nextSong","click .stop":"stopSong","click .play":"playSong","click .pause":"pauseSong"},ui:{buttons:".btn",prev:".prev",next:".next",stop:".stop",play:".play",shuffle:".shuffle",repeat:".repeat",runningTime:".time.running",lengthTime:".time.length",coverart:".image"},initialize:function(){b.network.command("currentsong"),this.listenTo(b.state,"change",function(){this.updatePlayer()})},onShow:function(){$(document).on("keyup.player",this.handleKeyboard.bind(this))},onClose:function(){$(document).off("keyup.player")},onRender:function(){this.updatePlayer()},updateCoverArt:function(a){var b=a.get("coverart");this.ui.coverart.css("background-image","url('"+b+"')")},updatePlayer:function(){var a=this.model,c=this.model.get("time").split(":"),d=+c[0],e=+c[1];this.ui.play.toggleClass("pause","play"===b.state.get("state")),"play"===b.state.get("state")?(clearInterval(this.playInterval),this.playInterval=setInterval(function(){a.set({time:++d+":"+e})},1e3)):clearInterval(this.playInterval)},updateTimer:function(a){var c=a.get("time").split(":"),d=+c[0],e=+c[1];this.ui.runningTime.html(b.Utils.formatSeconds(d)),this.ui.lengthTime.html(b.Utils.formatSeconds(e))},updateMaster:function(a){this.$(".master").html(a)},prevSong:function(){b.network.command("previous")},nextSong:function(){b.network.command("next")},stopSong:function(){b.network.command("stop")},playSong:function(){this.ui.play.is(".pause")||("pause"===b.state.get("state")?b.command("pause",0):b.command("play"))},pauseSong:function(){b.command("pause",1)},handleKeyboard:function(a){32===a.which&&("play"!==b.state.get("state")?this.playSong():this.pauseSong(),a.preventDefault())}}),a.ScrubberView=d.ItemView.extend({className:"scrubber",template:"scrubber",model:b.current,modelEvents:{"change:time":"updateScrubber"},events:{mousedown:"scrub"},ui:{progress:".progress"},initialize:function(){this.listenTo(b.state,"change",function(){this.updateScrubber()})},onRender:function(){this.updateScrubber()},updateScrubber:function(){var a=this.ui.progress,b=this.model.get("time").split(":"),c=+(b[0]||0),d=+b[1];d||a.width(0),a.width(c/d*100+"%")},scrub:function(a){var c=a.offsetX/this.$el.width(),d=this.model.get("time").split(":"),e=+d[1];e&&b.command("seekid",[this.model.id,Math.floor(e*c)])}})});return b});