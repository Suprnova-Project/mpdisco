/*! mpdisco 2014-06-26 */
define(["mpdisco","jquery.cookie"],function(a){var b=a.module("User",function(a,b,c,d,e){a.Model=b.Model.extend({defaults:{displayName:"User",thumbnailUrl:"http://www.gravatar.com/avatar/00000000000000000000000000000000"},socketEvents:{master:"set"},initialize:function(){this.listenTo(b.vent,"networkready",function(a){a.master&&this.set(a.master)})},idAttribute:"userid"}),a.Collection=b.Collection.extend({model:a.Model,comparator:function(a){var b=a.get("name");return b&&b.giveName||a.get("displayName")},socketEvents:{identify:"add",clientconnected:"add",clientdisconnected:"removeById"},initialize:function(){this.listenTo(b.vent,"networkready",function(a){a.clients&&this.reset(a.clients)})},removeById:function(a){this.remove(this.findWhere({userid:a.userid}))}}),a.UserView=d.ItemView.extend({className:"user",getTemplate:function(){return this.isIdentified?"user":"user_identify"},socketEvents:{identify:"identified"},modelEvents:{change:"showUser"},model:new a.Model,events:{'keyup input[type="text"]':"enterInfo"},ui:{name:'input[type="text"]'},isIdentified:!1,render:function(){this.isClosed=!1,this.triggerMethod("before:render",this),this.triggerMethod("item:before:render",this);var a=this.serializeData();a=this.mixinTemplateHelpers(a);var b=this.getTemplate(),c=d.Renderer.render(b,a);if(this.$el.on("transitionend webkitTransitionEnd oTransitionEnd",function g(){var a=e(this);a.find(".content").length>1&&a.removeClass("switching").find(".content").first().remove(),a.off("transitionend webkitTransitionEnd oTransitionEnd",g)}),this.$el.find(".content").length){this.$el.append(c);var f=setTimeout(function(){this.$el.addClass("switching"),clearTimeout(f)}.bind(this),100)}else this.$el.html(c);return this.bindUIElements(),this.triggerMethod("render",this),this.triggerMethod("item:rendered",this),this},onShow:function(){e.cookie("mpdisco.name")&&!this.isIdentified&&this.sendInfo()},identified:function(){this.isIdentified=!0,this.showUser()},showUser:function(){this.isIdentified&&(this.render(),this.$el.removeClass("loading"))},enterInfo:function(a){13==a.which&&this.sendInfo()},sendInfo:function(){var a=e.cookie("mpdisco.name")||this.ui.name.val();this.$el.addClass("loading"),e.cookie("mpdisco.name",a,{expires:7}),b.network.send("identify",a)}}),a.ListenerView=d.ItemView.extend({tagName:"li",className:"listener",template:"listener",onRender:function(){this.$el.attr("data-id",this.model.get("userid"))}}),a.ListenersView=d.CompositeView.extend({className:"listeners",template:"listeners",collectionEvents:{reset:"render"},collection:new a.Collection,childView:a.ListenerView,childViewContainer:".list",appendHtml:function(a,b,c){var d=a.childViewContainer?a.$(a.childViewContainer):a.$el,e=d.children();e.size()-1<=c?d.append(b.el):d.children().eq(c).before(b.el)}})});return b});