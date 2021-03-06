$(document).ready(function() {

  DemaciaTV.init();

  DemaciaTV.getSocketIO().on('connection', function () {
    DemaciaTV.getSocketIO().on('news', function (data){
      console.log(data);
    });
    DemaciaTV.getSocketIO().on('disconnect', function (){});
  });

  var clientid = (document.domain !== "demacia.tv") ? 'j0yll37nxeynttp6x4jb9sj4d4v9ev3' : 'fefe576hz482zz8rkx34x5cwxy2y0s';
  Twitch.init({clientId: clientid}, function(error, status) {
    if (error) {
      // error encountered while loading
      console.log(error);
    }
    // the sdk is now loaded
    if (status.authenticated) {
      // already logged in, hide button
      //$('.twitch-connect').hide()
      Twitch.api({method: 'user'}, function(error, user) {
        $('#connected').html('&nbsp;Connected as ' + user.display_name);
        DemaciaTV.getSocketIO().emit('login', {name: user.display_name});
      });
    }
  });

  // Make the connect button work
  $('.twitch-connect').click(function() { Twitch.login({ scope: ['user_read', 'channel_read'] }); });
  
  // Display the navigation
  DemaciaTV.getTopGames(25);

  // Hotkeys
  $(document).bind('keydown', '1',     function() { DemaciaTV.setFocus('1'); });
  $(document).bind('keydown', '2',     function() { DemaciaTV.setFocus('2'); });
  $(document).bind('keydown', '3',     function() { DemaciaTV.setFocus('3'); });
  $(document).bind('keydown', '4',     function() { DemaciaTV.setFocus('4'); });
  $(document).bind('keydown', 'f',     function() { DemaciaTV.toggleFullscreen(); });
  $(document).bind('keydown', 'g',     function() { DemaciaTV.toggleStreamFill(); });
  $(document).bind('keydown', 'left',  function() { DemaciaTV.toggleSidebar(); });
  $(document).bind('keydown', 'right', function() { DemaciaTV.toggleChat(); });
  $(document).bind('keydown', 'd',     function() { DemaciaTV.removeChannel(DemaciaTV.getFocus()); });

  // Hide streams
  // $('p.stream-controls').append('<a href="javascript:void(0)" id="streamtoggle"> Toggle stream</a>');
  // $('#streamtoggle').click(function() {
  //   $('#stream-container_1').toggle();
  //   $('#stream-container_2').toggle();
  // });


  // Enable stream containers to accept stream dropping
  var indices = ['1', '2', '3', '4'];
  for(var i = 0; i < indices.length; i++) {
    $('#stream-container_'+indices[i]).droppable({
      accept: '.stream-listing',
      drop: (function (i) {
        return function(event, ui){
          DemaciaTV.changeChannel(i, ui.draggable.data('channel'));
          DemaciaTV.setFocus(i);
          $('.ui-draggable-dragging').remove();
        }
      })(indices[i])
    });
  }


  // Arrow buttons: Toggle chat and sidebar
  $('#chat-toggle-left').hide();
  $('#chat-toggle-right').click(DemaciaTV.toggleChat);
  $('#chat-toggle-left').click(DemaciaTV.toggleChat);
  $('#sidebar-toggle-right').hide();
  $('#sidebar-toggle-left').click(DemaciaTV.toggleSidebar);
  $('#sidebar-toggle-right').click(DemaciaTV.toggleSidebar);

  // Change stream on enter key in the text box
  $('#picker').keydown(function (e){ if(e.keyCode === 13) DemaciaTV.changeChannel(DemaciaTV.getFocus(), $(this).val()); });
});


var DemaciaTV = (function () {
  // Private data goes here:
  var gamesList = {}
    , currentGame = ''
    , streamList = {}
    , headerSize = ''
    , footerSize = ''
    , chatSize = ''
    , focused = '1'
    , sidebarSize = '';

  var socketio;

  // Public data goes here:
  return {
    // Private data init
    init: function () {
      headerSize = $('#header').css('height');
      footerSize = $('#footer').css('height');
      chatSize = $('#chat-container').css('width');

      sidebarSize = $('#sidebar').css('width');
      socketio = io.connect('http://' + document.domain);
    },

    // Gets and displays a list of the top games being streamed
    getTopGames: function (amount) {
      $this = this;
      $('#sidebar-data').html('<img src="images/ajax_loader.gif" class="ajax-loader" />');
      Twitch.api({method: 'games/top', params: {limit: amount}}, function (error, games) {
        $this.displayGames(games);
        $this.gamesList = games;
      });
    },

    // Gets and displays a list of the top streams for a game
    getTopStreamsOfGame: function (game, amount) {
      $this = this;
      $('#sidebar-data').html('<img src="images/ajax_loader.gif" class="ajax-loader" />');
      Twitch.api({method: 'streams', params: {game: game, limit: amount}}, function (error, streams) {
        $this.displayStreams(streams);
        $this.currentGame = game;
      });
    },
    

    // Takes a Twitch API 'games' object and displays the list on the page 
    displayGames: function (games) {
      $this = this;
      $('#sidebar-data').html('<p id="nav_reload_games" class="stream-listing" align="center"><a href="javascript:void(0)">Reload List</a></p>');
      $('#nav_reload_games').click(function() { $this.getTopGames(25); });
      $.each(games.top, function(index, value) {
        $('#sidebar-data').append('<div id="nav_game_'+(index+1)+'" class="stream-listing"><img src="' +
         value.game.logo.small + '" height="36" width="60" /><p>#'+(index+1)+' <a href="javascript:void(0)" title="'+
         value.game.name+'">'+value.game.name+'</a><br />Viewers: '+ value.viewers +'</p></div>');
        $('#nav_game_'+(index+1)).click(function () {
          $this.getTopStreamsOfGame(value.game.name, 25);
        });
      });
    },

    // Takes a Twitch API 'streams' object and displays the list on the page 
    displayStreams: function (streams) {
      $this = this;
      $('#sidebar-data').html('<p id="nav_back" class="stream-listing" align="center"><a href="javascript:void(0)">Back</a></p>' +
        '<p id="nav_reload_streams" class="stream-listing" align="center"><a href="javascript:void(0)">Reload List</a></p>');
      $('#nav_back').click(function() { $this.displayGames($this.gamesList); });
      $('#nav_reload_streams').click(function() { $this.getTopStreamsOfGame($this.currentGame, 25); });
      
      $.each(streams.streams, function(index, value) {

        $('#sidebar-data').append('<div id="nav_stream_' + (index+1) +
          '" class="stream-listing"><img src="' + 
          value.preview.medium.replace("320x200", "60x36") + 
          '" height="36" width="60" /><p>#'+ (index+1) +
          ' <a href="javascript:void(0)" title="'+value.channel.status+'">'+
          value.channel.display_name + '</a><br />Viewers: '+ value.viewers +'</p></div>');

        $('#nav_stream_'+(index+1)).data('channel', value.channel.name);
        $('#nav_stream_'+(index+1)).click(function () {
          $this.changeChannel(focused, value.channel.name);
        });

        // Enable dragging on the stream nav
        $('#nav_stream_'+(index+1)).draggable({
          helper: 'clone',
          revert: 'invalid',
          containment: 'DOM',
          zIndex: 100000,
          appendTo: 'body',
          start: function(e, ui) {
            $(ui.helper).addClass("ui-draggable-helper");
          }
        });
      });
    },
    
    // Gives focus to a specific stream
    // - Mutes all other streams 
    // - Unmutes the focused stream
    // - Brings to front the focused chat
    setFocus: function (cindex) {
      var alreadyfocused = (focused === cindex);
      focused = cindex;
      var indices = ['1', '2', '3', '4'];
      for(var i = 0; i < indices.length; i++) {
        if(cindex === indices[i]) continue;
        $('#stream-container_'+indices[i]).css('z-index', '');
        this.mute(indices[i]);
        $('#chat_'+indices[i]).hide();
      }
      $('#stream-container_'+cindex).css('z-index', '10');
      if(alreadyfocused) this.toggleSound(cindex);
      else this.unmute(cindex);
      $('#chat_'+cindex).show();
    },
    
    getFocus: function () {
      return focused;
    },

    // Toggles the sound of a stream
    toggleSound: function (cindex) {
      ($('#stream-container_'+cindex).data('mute') === 'true') ? this.unmute(cindex) : this.mute(cindex);
    },

    // Mutes a specific stream
    mute: function (cindex) {
      $('#stream-container_'+cindex).data('mute', 'true');
      var player = $('#stream_'+cindex)[0];
      if(player !== undefined) player.mute();
    },
    
    // Unmutes a specific stream
    unmute: function (cindex) {
      $('#stream-container_'+cindex).data('mute', 'false');
      var player = $('#stream_'+cindex)[0];
      if(player !== undefined) player.unmute();
    },
    
    // Changes the channel at cindex
    changeChannel: function (cindex, channel) {
      this.removeChannel(cindex);
      $this = this;
      Twitch.api({method: 'users/' + channel}, function(error, user){
        if(error){
          console.log(error);
          $('#picker').after('<span class="stream-error"> ' + error.message + '</span>');
          $('.stream-error').fadeOut(1500, function() { $(this).remove(); });
          return;
        }
        $('#stream_'+ cindex).remove();
        $('#chat_'+ cindex).remove();
        $this.addStream(cindex, channel);
        $this.addChat(cindex, channel);
        streamList[cindex] = channel;
        socketio.emit('start-watching', {'channel': streamList[cindex]});
      });
    },

    
    removeChannel: function (cindex) {
      $('#stream-container_'+cindex).html('<div class="empty"><div class="empty2">'+ cindex +'</div></div>');
      $('#chat_'+cindex).remove();
      if(streamList[cindex])
        socketio.emit('stop-watching', {'channel': streamList[cindex]});
      streamList[cindex] = "";
    },



    // Adds a new stream in the index slot
    addStream: function (cindex, channel) {
      $('#stream-container_'+cindex).livestream(channel, {
        width: '100%',
        height: '100%',
        autoPlay: true,
        startVolume: 50,
        cindex: cindex,
        //onLive: function(element, streamer) { },
        //onOffline: function(element, streamer) { }
      });
      $('#stream-container_'+cindex).data('mute', 'false');
    },
    

    // Adds a new chat in the index slot
    addChat: function (cindex, channel) {
      $('#chat-container').append('<iframe width="300px" height="100%" id="chat_'
        +cindex+'" scrolling="no" frameborder="0" '+
        'src="http://www.twitch.tv/chat/embed?channel='+channel+'&popout_chat=true"></iframe>');
    },
    


    // Hides the chat box with animation
    toggleChat: function () {
      var speed = 250;
      if($('#header').css('right') === '0px') {
        $('#chat-container').animate({ width: chatSize}, speed);
        $('#header,#content,#footer').animate({right: chatSize}, speed);
      } else {
        $('#chat-container').animate({ width: '0'}, speed);
        $('#header,#content,#footer').animate({right: '0'}, speed);
      }
      window.setTimeout(function() {
        $('#chat-toggle-right').toggle();
        $('#chat-toggle-left').toggle();
        //$(window).resize();
      }, speed);
    },


    // Show or hide the left sidebar
    toggleSidebar: function () {
      var speed = 250;
      if($('#sidebar').css('right') === '0px') {
        $('#sidebar').animate({ right: sidebarSize, left: '0'}, speed);
        $('#header,#content,#footer').animate({left: sidebarSize}, speed);
      } else {
        $('#sidebar').animate({ right: '0', left: '-'+sidebarSize}, speed);
        $('#header,#content,#footer').animate({left: '0'}, speed);
      }
      window.setTimeout(function() {
        $('#sidebar-toggle-right').toggle();
        $('#sidebar-toggle-left').toggle();
      }, speed);
    },


    // Content area fills the entire screen
    toggleFullscreen: function () {
      var speed = 250;
      if($('#header').css('height') === '0px') {
        //Reset
        $('#sidebar').animate({right: sidebarSize, left: '0'}, speed);
        $('#header').animate({height: headerSize, right: chatSize, left: sidebarSize}, speed);
        $('#content').animate({top: headerSize, bottom: footerSize, right: chatSize, left: sidebarSize}, speed);
        $('#footer').animate({height: footerSize, right: chatSize, left: sidebarSize}, speed);
        $('#chat-container').animate({ width: chatSize}, speed);
      } else {
        //To Fullscreen
        $('#sidebar').animate({right: '0', left: '-'+sidebarSize}, speed);
        $('#header').animate({height: '0', right: '0', left: '0'}, speed);
        $('#content').animate({top: '0', bottom: '0', right: '0', left: '0'}, speed);
        $('#footer').animate({height: '0', right: '0', left: '0'}, speed);
        $('#chat-container').animate({ width: '0'}, speed);
      }
    },

    // Focused stream will fill up the entire content area. 
    toggleStreamFill: function () {
      var speed = 250;
      if($('#stream-container_'+focused).css('width') === $('#content').css('width')) {
        //Reset
        $('#stream-container_'+focused).css({
          'z-index': '',
          'width': '',
          'height': '',
          'left': '',
          'top': ''
        });
      } else {
        //To Fullscreen
        $('#stream-container_'+focused).css({
          'z-index': '10',
          'width': '100%',
          'height': '100%',
          'left': '0',
          'top': '0'
        });
      }
    },

    getSocketIO: function() {
      return socketio;
    },
  };
}());