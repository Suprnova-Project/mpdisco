/*! mpdisco 2014-06-26 */
define(["mpdisco","player","user","playlist","library"],function(a,b,c,d,e){var f=a.module("BasicMode",function(a){a.Mode={player:b.PlayerView,user:c.UserView,scrubber:b.ScrubberView,playlist:d.PlaylistView,listeners:c.Listeners,library:e.LibraryView}});return f});