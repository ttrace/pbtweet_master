//v1.5 master 0073
// ==UserScript==
// @name      pbtweet
// @namespace    http://t-trace.blogspot.com/
// @description   Expanding conversation chains, shorten URLs, tranlating, and adding picture services thumbnails.
// @include   https://twitter.com/*
// @include   http://twitter.com/*
// ==/UserScript==
// UPDATE INFO http://web.me.com/t_trace/pbtweet.html

( function(){

// initialize pbtweet if pbtweet not works.
if(!document.getElementById('pb_info'))
{
	pb_init();
}
else
{
	return(false);
}

// initialize pbtweet//
function pb_init()
{
	setTimeout( pb_css_set() , 1 );
	conv_chain_hash = new Array(0);
	session_id = document.getElementsByName('session-user-screen_name')[0].content;
	pb_latest_update = new Date();

	//information panel
	pb_version = "v1.5 master 0073";
	pb_active_group = null;

	//preference values
	restore_pb_values();
	document.pb_lang = pb_lang;
	bitly_token = '';

	//unread counter
	if(document.getElementById('home_tab'))
	{
		var unread_counter_home = document.createElement('span');
		unread_counter_home.setAttribute( 'class' , 'counter' );
		unread_counter_home.id = ('unread_counter_home');
		document.getElementById('home_tab').getElementsByTagName('span')[0].appendChild(unread_counter_home);
		document.getElementById('home_tab').getElementsByTagName('a')[0].addEventListener( 'click' , function(e)
			{
				timeline_remover();
			} , true );
		
		var unread_counter_mention = document.createElement('span');
		unread_counter_mention.setAttribute( 'class' , 'counter' );
		unread_counter_mention.id = ('unread_counter_mention');
		unread_counter_mention.innerHTML = ' (' + unread_mentions + ')';
		document.getElementById('replies_tab').getElementsByTagName('span')[0].appendChild(unread_counter_mention);
		document.getElementById('replies_tab').getElementsByTagName('a')[0].addEventListener( 'click' , function(e)
			{
				timeline_remover();
				unread_counter_mention.innerHTML = ' (0)';
				unread_mentions = 0 ;
				set_storage_Value( 'pb_unread_mentions' , unread_mentions );
			} , true );
		
		document.getElementById('status').addEventListener( 'keyup' , function(e)
			{
				shorten_url(e.target , 'withspace');
				bitly_token = guid();
				var bitly_token_temp = bitly_token;
				setTimeout(function(e)
				{
					shorten_url( document.getElementById('status') , 'all' , (bitly_token_temp + ''));
				} , 1500);
			} , true );

		document.getElementById('status').addEventListener( 'focus' , function(e)
			{
				shorten_url(e.target , 'all');
			} , true );

		document.getElementById('status').addEventListener( 'blur' , function(e)
			{
				shorten_url(e.target , 'all');
			} , true );	
		
		var unread_counter_messages = document.createElement('span');
		unread_counter_messages.setAttribute( 'class' , 'counter' );
		unread_counter_messages.id = ('unread_counter_messages');
		unread_counter_messages.innerHTML = ' (' + unread_inbox +')';
		document.getElementById('direct_messages_tab').getElementsByTagName('span')[1].appendChild(unread_counter_messages);
		document.getElementById('direct_messages_tab').getElementsByTagName('a')[0].addEventListener( 'click' , function(e)
		{
			unread_counter_messages.innerHTML = ' (0)';
			unread_inbox = 0 ;
			set_storage_Value( 'pb_unread_inbox' , unread_inbox );
		} , true );

		if( latest_message_id == 0 )
		{
			check_inbox("message","init");
		}
		else
		{
			check_inbox("message");
		}
	
		if( latest_mention_id == 0 )
		{
			check_inbox("mention","init");
		}
		else
		{
			check_inbox("mention");
		}
	
	}
		
	var notifire_canvas = document.createElement('div');
	notifire_canvas.id = 'notifire_canvas';
	notifire_canvas.style.position = 'fixed';
	notifire_canvas.style.width = '450px';
	notifire_canvas.style.top = '0px';
	
	document.body.appendChild(notifire_canvas);
	
	//enable_accesskey = false;

	//init process
	pb_info_panel();
	if(document.getElementById('side'))
	{
		pb_group_tab();
		remove_accesskey();
	}
	
	//build pb-extra
	pb_extra = document.createElement('span');
	pb_extra.setAttribute('class','pb-extra');

	pb_trans = document.createElement('span');
	pb_trans.setAttribute('class','pb-trans');
	pb_trans.innerHTML = "to&nbsp;" + pb_lang.toUpperCase();
	pb_extra.appendChild(pb_trans);
	
	pb_rtwweet = document.createElement('span');
	pb_rtwweet.setAttribute('class','pb-rtweet');
	pb_rtwweet.innerHTML = "RT";
	pb_extra.appendChild(pb_rtwweet);
	
	pb_via = document.createElement('span');
	pb_via.setAttribute('class','pb-via');
	pb_via.innerHTML = "(via&nbsp;";
	pb_extra.appendChild(pb_via);
	
	pb_dm = document.createElement('span');
	pb_dm.setAttribute('class','pb-dm');
	pb_dm.innerHTML = "DM";
	pb_extra.appendChild(pb_dm);
	
	pb_temp_target = document.createElement('span');

	// add pb_main event
	if(!document.getElementById('show')){
		// more button
		document.getElementById('content').addEventListener("DOMNodeInserted", 
			function (event)
			{
				if(event.target.id == 'timeline')
				{
					conv_chain_hash = new Array(0);
					pbtweet_main(event.target.getElementsByClassName('hentry'));
					event.target.addEventListener("DOMNodeInserted", 
					function (event)
					{
						if(event.target.nodeName == "LI" && (pb_is_in_group(event.target) == false))
						{
							event.target.style.opacity = '1';
							event.target.style.marginTop = '0px';
							event.target.style.webkitTransition = "";
							removeClass(event.target, 'animate');
							addClass(event.target, 'pbHiddenGroup');
							pbtweet_main([event.target]);
						}
						else
						{
							if(event.target.nodeName == "LI" &&  (!hasClass(event.target, "animate")))
							{
								pbtweet_main([event.target]);
							} else if(event.target.nodeName == "LI") {
								kick_animation_on_top(event);
							}
						}
					}, false);
				}
				else if(hasClass(event.target, "conv_chain"))
				{
					kick_animation(event.target)
				}
			}, false);
			
		pb_add_eventlistener_to_timeline();
	}

	// make master objects
	try
	{
		master_fav = document.getElementsByClassName("fav-action")[0].cloneNode(true);
		master_reply = document.getElementsByClassName("reply")[0].cloneNode(true);
	}
	catch(err)
	{
		master_fav = document.createElement('a');
		master_fav.className = "fav-action";
		master_reply = document.createElement('a');
		master_reply.className = "reply";
	}

	pb_snip_url = document.createElement('span');

	//make Y!Pipes for Image receiver
	bkite_processor = document.createElement('script');
	bkite_processor.innerHTML = "var bkiteSrc = function(data){place_picture(data.value.items[1].content,data.value.items[0].content,data.value.items[2].content);}";
	document.getElementsByTagName("head")[0].appendChild(bkite_processor);

	//make tinyUrl receiver
	tinyUrl_processor = document.createElement('script');
	tinyUrl_processor.innerHTML = "var pbTurlExp = function(data){expand_url(data.value.items[0].content,data.value.items[1].content);}";
	document.getElementsByTagName("head")[0].appendChild(tinyUrl_processor);

	if(document.body.id != 'show')
	{
		var nav_buttons = document.getElementById('primary_nav').getElementsByTagName('a');
		for(var i = 0; i < nav_buttons.length; i++){
 			nav_buttons[i].addEventListener('click', function(e)
 			{
 				setTimeout(function(e)
 				{
						conv_chain_hash = new Array(0);
 				}, 1)
 			},true);
 		}
 		var page_type = document.getElementById('side').getElementsByClassName('active')[0];
 		switch (page_type.id)
 		{
 			case "home_tab":
 				var update_target = document.getElementById('home_tab');
 				break;
 			case "replies_tab":
 				var update_target = document.getElementById('replies_tab');
 				break;
 			case "favorites_tab":
 				var update_target = document.getElementById('favorites_tab');
 				break;
  			case "profile_tab":
 				var update_target = document.getElementById('updates_tab');
 				break;
  			case "update_tab":
 				var update_target = document.getElementById('update_tab');
 				break;
 			default:
  				//var update_target = document.createElement('div');
 		}
		pbtweet_main(document.getElementById('timeline').getElementsByClassName('hentry')); //initial
	 } else {
		pbtweet_main(document.getElementById('permalink').getElementsByClassName('hentry')); //initial for status page	 
	 }

	if( navigator.vendor.match(/Google/) || navigator.userAgent.match(/Chrome/) || navigator.userAgent.match(/Opera/ ))
	{	// in order to support Google
		load_localscript();
	}
}

function pb_add_eventlistener_to_timeline(timeline)
{
	document.getElementById("timeline").addEventListener("DOMNodeInserted", 
		function (event)
		{
			if(event.target.nodeName == "LI" && (pb_is_in_group(event.target) == false))
			{
				event.target.style.opacity = '1';
				event.target.style.marginTop = '0px';
				removeClass(event.target, 'animate');
				addClass(event.target, 'pbHiddenGroup');
				pbtweet_main([event.target]);
			}
			else
			{
				if(event.target.nodeName == "LI" &&  (!hasClass(event.target, "animate")))
				{
					pbtweet_main([event.target]);
				} else if(event.target.nodeName == "LI") {
					kick_animation_on_top(event);
				}
			}
		}, false);
}


// main process
function pbtweet_main(target)
{
	var repeat_count = chain_count ;

	// if target is moving... delay
	// standard window
	if(!document.getElementById('show')) // if not single status page
	{
		var entry = target;
		for (var i=0; i < entry.length; i++)
		{
			for(var j = 0; j < conv_chain_hash.length; j++)
			{	// remove redundant tweet
				try
				{
					if(entry[i].id == conv_chain_hash[j])
					{
						remove_redundand(entry[i].id, 'inserted');
						break;
					}
				}
				catch(err)
				{
				}
			}
			try
			{
				if(entry[i].getElementsByClassName('msgtxt')[0])
				{	//change search result
					addClass(entry[i].getElementsByClassName('msgtxt')[0], 'entry-content');
					addClass(entry[i].getElementsByClassName('meta')[0].getElementsByTagName('a')[0], 'entry-date');
					entry[i].getElementsByClassName('meta')[0].getElementsByTagName('a')[0].href = entry[i].getElementsByClassName('meta')[0].getElementsByTagName('a')[0].href.replace(/\/([a-zA-Z0-9\-\_]+)\/statuses/, '/$1/status');
				}
				if(entry[i].hasAttribute("id"))
				{	//add external links.
					if(entry[i].getElementsByClassName('entry-content')[0])
					{	// normal tweet
						entry[i].getElementsByClassName('entry-content')[0].innerHTML = pb_link_maker(entry[i].getElementsByClassName('entry-content')[0].innerHTML,'main');
					}
					else if(entry[i].getElementsByClassName('msgtxt')[0])
					{	// search tweet
						entry[i].getElementsByClassName('msgtxt')[0].innerHTML = pb_link_maker(entry[i].getElementsByClassName('msgtxt')[0].innerHTML,'main');					
					}

					pb_snip_retreiver(entry[i]);
					twitpic_thumb(entry[i].id,entry[i].innerHTML);
					pb_extra_set(entry[i]);
					pb_appearance_set(entry[i]);
				}
				var meta_url_list = entry[i].getElementsByClassName('meta')[0].getElementsByTagName('a');
				var get_url = "";
				
				for( var k = 1 ; k < meta_url_list.length ; k++ )
				{
					// searching in_reply_to_status_id urls.
					if( meta_url_list[k].href.match(/\:\/\/twitter.com\/[^\/]+\/status\/[0-9]+/) )
						{
							get_url = meta_url_list[k].href;
							break;
						}
				}

				if(get_url != "" && (!entry[i].getElementsByClassName('conv_chain')[0]))
				{
					var my_node = entry[i].id;
					// delaying //
					if(hasClass(entry[i],"animate")){
						setTimeout(pbtweet_main([entry[i]]), 1000);
					} else {
						document.getElementById(my_node).addEventListener("DOMNodeInserted", function(event){if(hasClass(event.target, "conv_chain")){kick_animation(event.target)}}, false);
						retreve_data(get_url,my_node, repeat_count );
					}
				}
			}
			catch(err)
			{
				//window.console.log = window.console.log + err.message + "on " + entry;
				//document.error = entry;
			}
		}
	}
	else
	{	//tweet status view
			try
			{
				var pic_entry = document.getElementsByClassName("status-body")[0];
				pic_entry.setAttribute("id",guid());
				twitpic_thumb(pic_entry.id,pic_entry.innerHTML);
				var meta_target = document.getElementsByClassName("meta");
				get_url = meta_target[0].childNodes[4].href;
				if(document.getElementById("content").childElementCount == 1)
				{
					retreve_data(get_url,"content", repeat_count );
				}
				
				var entry = document.getElementsByClassName("hentry")[0];
				
				pb_snip_retreiver(entry);
				pb_extra_set(entry);
				pb_appearance_set(entry);
			}
			catch(err)
			{
				window.console.log = window.console.log + err.message;
			}
	}
}

function retreve_data( get_url , my_node , count )
{
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if(request.readyState == 4 && request.status == 200)
		{
			conv_object = eval('(' + request.responseText + ')');
			var profile_image_url = conv_object["user"]["profile_image_url"];
			var user_name = conv_object["user"]["screen_name"];
			var conv_mine = "";
			var read_more = false;
			if (user_name == session_id){
				conv_mine = " mine";
			}
			var url_replace = /\:\/\/twitter\.com\/[^\/]+\/status\/[0-9]+\"\>in\ reply\ to/;
			var conv_innerHTML = "<span class = \'icons\'><a href='"+ window.location.protocol + "//twitter.com/" + user_name + "'><img src ='" + profile_image_url + "'></a></span><span class=\'entry-content " + user_name + conv_mine + "\'><strong>" + "<a href='" + window.location.protocol + "//twitter.com/" + user_name + "' title='" + conv_object["user"]["name"] + "'>" +user_name + "</a> </strong>" + pb_link_maker(conv_object["text"]) + "</span>";
			if(conv_object["in_reply_to_status_id"]){
				var retreve_status = window.location.protocol + "//twitter.com/" + conv_object["in_reply_to_screen_name"] + "/status/" + conv_object["in_reply_to_status_id"];
				//retreve_data(retreve_status,my_node);
 				if( count > 1 ) {
 					retreve_data( retreve_status , my_node , count - 1 );
 				} else {
 					read_more = true;
 				}
			}
			var conv_chain = document.createElement('div');
			conv_chain.innerHTML = conv_innerHTML;
			conv_chain.setAttribute("class","conv_chain");
			conv_chain.id = guid();

			// append fav and reply button
			var conv_action = document.createElement('div');
			conv_action.className = "actions";
			
			var conv_meta = window.location.protocol + "//twitter.com/" + user_name + "/status/" + conv_object["id"];
			var   conv_fav = master_fav.cloneNode(true);
			var conv_reply = master_reply.cloneNode(true);

			// detect favorite
			if(conv_object["favorited"] == true){
				removeClass(conv_fav,"non-fav");
				addClass(conv_fav,"fav");
			} else {
				removeClass(conv_fav,"fav");
				addClass(conv_fav,"non-fav");
			}

			var conv_entry_meta = document.createElement('span');
			conv_entry_meta.setAttribute('class','meta entry-meta');
			var post_date = new Date(conv_object["created_at"]);
			var current_date = new Date();
			var string_duration = post_date.toString().replace(/\s[0-9][0-9]:.+/,'');

			conv_entry_meta.innerHTML = "<a href='" + conv_meta + "' class='entry-date' rel='bookmark'><span class='published'>" + string_duration +" </span></a> <span>from " + conv_object["source"] + "</span>";
			if(conv_object["in_reply_to_status_id"]){
				conv_entry_meta.innerHTML = " " + conv_entry_meta.innerHTML +  " <a href='" + window.location.protocol + "//twitter.com/" + conv_object["in_reply_to_screen_name"] + "/status/" + conv_object["in_reply_to_status_id"] +"'>in reply to " + conv_object["in_reply_to_screen_name"] + "</a>";
			}
			conv_chain.appendChild(conv_entry_meta);

			// append chat balloon
			var conv_baloon = document.createElement('span');
			conv_baloon.className = "entry-baloon";

			var conv_baloon_top = document.createElement('span');
			conv_baloon_top.className = "entry-content-before";
			var conv_baloon_bottom = document.createElement('span');
			conv_baloon_bottom.className = "entry-content-after";
			if (user_name == session_id){
				addClass(conv_baloon_top,"mine");
				addClass(conv_baloon_bottom,"mine");
			}
			
			conv_baloon.appendChild(conv_baloon_top);
			conv_baloon.appendChild(conv_chain.getElementsByClassName('entry-content')[0]);
			conv_baloon.appendChild(conv_baloon_bottom);
			conv_baloon.appendChild(conv_entry_meta);

			conv_chain.appendChild(conv_baloon);
			
			//var conv_path = location.href.match(/.+\/\/twitter.com(\/[^\/]+)/)[1];
			var conv_path = 'http://twitter.com/';
			var href_match = /.+\:\/\/twitter\.com\/(.+)\/status\/([0-9]+)/;
			conv_reply.href = conv_path + "?status=@" + conv_meta.match(href_match)[1] + "%20&amp;in_reply_to_status_id=" + conv_meta.match(href_match)[2] + "&amp;in_reply_to=" + conv_meta.match(href_match)[1];
			conv_reply.title = "reply to " + conv_meta.match(href_match)[1];
			conv_fav.id = "status_star_" + conv_meta.match(href_match)[2];

			conv_reply.className = "pb-reply";
			removeClass(conv_fav,'fav-action');
			addClass(conv_fav,'pb-fav-action');

			conv_action.appendChild(conv_fav);
			conv_action.appendChild(conv_reply);
			//
			conv_chain.insertBefore(conv_action, conv_baloon.nextSibling);

			//add reply function
			conv_reply.name = conv_reply.href;
			if( document.body.id.match(/home|replies|favorites|search/) )
			{
				// home
				conv_reply.removeAttribute("href");
				conv_reply.addEventListener("click", function(e){pb_reply(e);e.preventDefault();e.stopPropagation}, false);
			} else {
				conv_reply.href = conv_reply.href.replace(/twitter.com\/(timeline\/)*[^\?]+/, "twitter.com/$1home");
				conv_reply.href = conv_reply.href.replace(/&amp;/g, "&");
			}
			
			//add fave event
			conv_fav.addEventListener("click", function(e){pb_fave(e);e.preventDefault()}, false);
			if(my_node != "content"){
				conv_chain.style.marginTop = "-60px";
			}
			pb_extra_set(conv_chain);
			
			//add snip retreiving
			pb_snip_retreiver(conv_chain);
			
			//read more button
			var conv_read_more = document.createElement('div');
			addClass(conv_read_more, 'conv-read-more');
			conv_read_more.innerHTML = 'read more...';
			conv_read_more.addEventListener( "click" , function(e)
				{
					conv_read_more.innerHTML = "<span style='opacity: 0.4'>loading...</span>";
					conv_read_more.style.backgroundImage = "url(http://assets0.twitter.com/images/loader.gif)";
					conv_read_more.style.backgroundColor = "white";
					setTimeout(function()
						{
							conv_read_more.parentNode.removeChild(conv_read_more);
						}, 1000);
					retreve_data( retreve_status , my_node , 10 ) 
				} , false);
			
			pb_appearance_set(conv_chain,conv_chain.getElementsByClassName('entry-content')[0]);
			try{
				document.getElementById(my_node).appendChild(conv_chain);
				if(read_more == true )
				{
					document.getElementById(my_node).appendChild(conv_read_more);
				}
				//kick_animation(conv_chain);
			} catch(e){
				//window.console.log = e + "on add_child";
			}
			var status_id = get_url.replace(/.+\:\/\/twitter\.com\/[^\/]+\/status\/([0-9]+)/,"status_$1");
			if(status_id != null){
				conv_chain_hash.push(status_id);
				//setTimeout(remove_redundand(status_id),10);
				remove_redundand(status_id);
			}
			twitpic_thumb(conv_chain.id,conv_chain.innerHTML);
		}
	};
	if (location.href.match(/^https/) && get_url.match(/^https/)){
	} else if (location.href.match(/^https/) && get_url.match(/^http\:/)) {
		get_url = get_url.replace(/^http\:/, "https:");
	} else if (location.href.match(/^http\:/) && get_url.match(/^https/)) {
		get_url = get_url.replace(/^https\:/, "http:");
	} else if (location.href.match(/^http\:/) && get_url.match(/^http\:/)) {
	}
	request.open('GET', get_url, true);
// JSON 1st!!!
	request.setRequestHeader("Accept", "application/json, text/javascript, */*");
	request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	request.send(null);
}

function remove_redundand(target_id)
{
	if(arguments[1] != 'inserted')
	{
		try
		{
			var remove_target = document.getElementById(target_id);
			if( ((remove_target.offsetTop + remove_target.offsetHeight) < (window.scrollY + window.innerHeight)) && (remove_target.offsetTop + remove_target.offsetHeight) != 0)
			{
				var curr_scroll_x = window.scrollX;
				var curr_scroll_y = window.scrollY;
				window.scrollTo(curr_scroll_x, (curr_scroll_y - remove_target.offsetHeight));
			}
			// animation effects only std version
			//setTimeout(remove_target.style.display = "none", 400);
			remove_target.parentNode.removeChild(remove_target);
		} catch(e) {
			//window.console.log = window.console.log + '\n' + e + 'on removing';
		}
	}
	else
	{
		var remove_target = document.getElementById(target_id);
		remove_target.style.display = "none"
		//remove_target.parentNode.removeChild(remove_target);
	}
}

function hide_group(target_id)
{
	try
	{
		var remove_target = document.getElementById(target_id);
		if(arguments[2])
		{	// group on_off
		}
		setTimeout(function()
		{
			if(!hasClass(remove_target,'pbHiddenGroup'))
			{
				addClass(remove_target, ' pbHiddenGroup ');
				removeClass(remove_target, 'pbHiddingGroup')
			}
		}, 400);
		//remove_target.parentNode.removeChild(remove_target);
	} catch(e) {
		//window.console.log = window.console.log + '\n' + e + 'on removing';
	}
}

function twitpic_thumb(id,html)
{
	var my_source = html;
	if(my_source == ""){
		my_source = document.getElementById(id).childNodes[0].childNodes[0].innerHTML;
	}
	var twitpic_carrier = /(http\:\/\/twitpic.com\/[a-zA-Z0-9]+)/;
	var twitvid_carrier = /(http\:\/\/twitvid.com\/[a-zA-Z0-9]+)/;
	var tweetphoto_carrier = /http\:\/\/pic\.gd\/([a-zA-Z0-9]+)/;
	var movapic_carrier = /\"(http\:\/\/movapic.com\/pic\/([^\"]+))/;
	var yfrog_carrier = /http\:\/\/yfrog.[a-z]+\/([a-zA-Z0-9]+)/;
	var photoshare_carrier = /(http\:\/\/www.bcphotoshare\.com\/photos\/([0-9][0-9])[0-9]+\/([0-9]+))/;
	var bkite_carrier = /(Photo|pic)\:\ \<a\ [^\>]*href\=\"http\:\/\/bkite.com\/([0-9a-zA-Z]+)\"/;
	var sec_carrier = /http\:\/\/tiny12\.tv\/([a-zA-Z0-9]+)/;
	var tumbl_carrier = /http\:\/\/tumblr\.com\/([a-zA-Z0-9]+)/;
	var flickr_carrier = /http\:\/\/flic\.kr\/p\/([a-zA-Z0-9]+)/;
	var flickrcom_carrier = /http\:\/\/www\.flickr.com\/photos\/[a-z]+\/([0-9]+)/;
	var bctiny_carrier = /http\:\/\/bctiny\.com\/([a-zA-Z0-9]+)/;
	var fhatena_carrier = /(http\:\/\/f\.hatena\.ne\.jp\/(([^\/])[^\/]+)\/(([0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9])[0-9]+))/;
	
	//twitpic support
	if(my_source.match(twitpic_carrier)){
		var pic_thumb_src = my_source.match(twitpic_carrier)[1].replace(/http\:\/\/twitpic\.com\/([0-9a-zA-Z0-9]+)/,"http://twitpic.com/show/thumb/$1");
		place_picture(id,pic_thumb_src,my_source.match(twitpic_carrier)[1]);
	}
	//twitvid support
	if(my_source.match(twitvid_carrier)){
		var pic_thumb_src = my_source.match(twitvid_carrier)[1].replace(/http\:\/\/twitvid\.com\/([0-9a-zA-Z0-9]+)/,"http://cdn.twitvid.com/thumbnails/$1.jpg");
		place_picture(id,pic_thumb_src,my_source.match(twitvid_carrier)[1]);
	}
	// getting tweetphoto.com image
	if (my_source.match(tweetphoto_carrier)){
		var pic_thumb_query = my_source.match(tweetphoto_carrier)[1];
		var pic_thumb_loader = document.createElement('script');
		pic_thumb_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=bad514af30be9c742b19fd563c257a6b&_render=json&snipcode=" + pic_thumb_query + "&parentid=" + id + "&_callback=bkiteSrc";
		document.getElementsByTagName("head")[0].appendChild(pic_thumb_loader);
	}
	//photoshare support
	if(my_source.match(photoshare_carrier)){
		var pic_thumb_src = "http://images.bcphotoshare.com/storages/" + my_source.match(photoshare_carrier)[3] +"/thumb180.jpg";
		place_picture(id , pic_thumb_src , my_source.match(photoshare_carrier)[1]);
	}
	//fhatena support
	if(my_source.match(fhatena_carrier)){
		var pic_thumb_src = "http://img.f.hatena.ne.jp/images/fotolife/" + my_source.match(fhatena_carrier)[3] + "/" + my_source.match(fhatena_carrier)[2] + "/" + my_source.match(fhatena_carrier)[5] + "/" + my_source.match(fhatena_carrier)[4] + "_120.jpg";
		place_picture(id,pic_thumb_src,my_source.match(fhatena_carrier)[1]);
	}
	//movapic support
	if(my_source.match(movapic_carrier)){
		var pic_thumb_src = "http://image.movapic.com/pic/s_" + my_source.match(movapic_carrier)[2] +".jpeg";
		place_picture(id,pic_thumb_src,my_source.match(movapic_carrier)[1]);
	}
	//yfrog support
	if(my_source.match(yfrog_carrier)){
		var pic_thumb_src = "http://yfrog.com/" + my_source.match(yfrog_carrier)[1] + ".th.jpg";
		place_picture(id,pic_thumb_src,"http://yfrog.com/" + my_source.match(yfrog_carrier)[1]);
	}
	// getting bkite.com image
	if (my_source.match(bkite_carrier)){
		var pic_thumb_query = my_source.replace(/.+<a\ [^\>]*href\=\"http\:\/\/bkite\.com\/([0-9a-zA-Z]+)\".+/,"http://bkite.com/objects/$1");
		var pic_thumb_loader = document.createElement('script');
		pic_thumb_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=WC_YK2IU3hGdr4ty6icw5g&_render=json&snipcode=" + pic_thumb_query + "&parentid=" + id + "&_callback=bkiteSrc";
		document.getElementsByTagName("head")[0].appendChild(pic_thumb_loader);
	}
	// getting 12sec.tv image
	if (my_source.match(sec_carrier)){
		var pic_thumb_query = my_source.match(sec_carrier)[1];
		var pic_thumb_loader = document.createElement('script');
		pic_thumb_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=db3a5299e7cc3465a16b8333891cdc8d&_render=json&snipcode=" + pic_thumb_query + "&parentid=" + id + "&_callback=bkiteSrc";
		document.getElementsByTagName("head")[0].appendChild(pic_thumb_loader);
	}
	// getting tumblr.com image
	if (my_source.match(tumbl_carrier)){
		var pic_thumb_query = my_source.match(tumbl_carrier)[1];
		var pic_thumb_loader = document.createElement('script');
		pic_thumb_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=d6a5ce53ecce335477faf60122f8f7f3&_render=json&snipcode=" + pic_thumb_query + "&parentid=" + id + "&_callback=bkiteSrc";
		document.getElementsByTagName("head")[0].appendChild(pic_thumb_loader);
	}
	// getting flic.kr image
	if (my_source.match(flickr_carrier)){
		var pic_thumb_query = my_source.match(flickr_carrier)[1];
		var pic_thumb_loader = document.createElement('script');
		pic_thumb_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=416a1c6eb426f097dcd35aa745cfe22d&_render=json&snipcode=" + base58_decode(pic_thumb_query) + "&parentid=" + id + "&_callback=bkiteSrc";
		document.getElementsByTagName("head")[0].appendChild(pic_thumb_loader);
	}
	// getting flickr.com image
	if (my_source.match(flickrcom_carrier)){
		var pic_thumb_query = my_source.match(flickrcom_carrier)[1];
		var pic_thumb_loader = document.createElement('script');
		pic_thumb_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=416a1c6eb426f097dcd35aa745cfe22d&_render=json&snipcode=" + pic_thumb_query + "&parentid=" + id + "&_callback=bkiteSrc";
		document.getElementsByTagName("head")[0].appendChild(pic_thumb_loader);
	}
	// getting bctiny_carrier image
	if (my_source.match(bctiny_carrier)){
		var pic_thumb_query = my_source.match(bctiny_carrier)[1];
		var pic_thumb_loader = document.createElement('script');
		pic_thumb_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=a5de4b4f98184e4d59896d907948397a&_render=json&snipcode=" + pic_thumb_query + "&parentid=" + id + "&_callback=bkiteSrc";
		document.getElementsByTagName("head")[0].appendChild(pic_thumb_loader);
	}
	return false;
}

function place_picture(id,pic_thumb_src,pic_href)
{
	var pic_thumb = document.createElement('img');
	var pic_thumb_link = document.createElement('a');
	pic_thumb_link.setAttribute("href", pic_href);
	pic_thumb_link.setAttribute("target", "_blank");
	var pic_thumb_id = guid();
	pic_thumb_link.setAttribute("id",pic_thumb_id);
	pic_thumb.setAttribute("class","twitpic_thumb");
	pic_thumb.setAttribute("src", pic_thumb_src);
	pic_thumb_link.appendChild(pic_thumb);
	document.getElementById(id).appendChild(pic_thumb_link);
}

//Make pseudo guid
function S4()
{
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

function guid()
{
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function base58_decode(snipcode)
{
	var alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
	var num = snipcode.length;
	var decoded = 0;
	var multi = 1;
	for ( var i = (num-1) ; i >= 0 ; i-- )
	{
		decoded = decoded + multi * alphabet.indexOf(snipcode[i]);
		multi = multi * alphabet.length;
	}
	return decoded;
}

//Standard function
function hasClass(ele,cls)
{
	try{
		return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
		} catch(err) {
		return false;
	}
	//return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls)
{
	if (!hasClass(ele,cls)) ele.className += " "+cls + " ";
}

function removeClass(ele,cls)
{
	if (hasClass(ele,cls)) {
	var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
	ele.className=ele.className.replace(reg,'');
	}
}



//--autoScrolll--//
var during_pagination = true;
setTimeout(function()
{
	if(!document.getElementById("autopagerize_style"))
	{
		init_autoPager();
	}
}, 1500);

function init_autoPager()
{
	during_pagination = false;
	window.addEventListener("scroll", function(){add_scroll_event()}, false);
}


function add_scroll_event()
{
	if(document.getElementById("content").clientHeight < (window.scrollY + window.innerHeight + 200) && (during_pagination == false)){
		during_pagination = true;
		add_next_page();
	};
}

// pb_add next page automatically
function add_next_page(){
	during_pagination = true;
	if(!location.href.match(/\/public_timeline$/)){
		var more_url = '';
		if(document.getElementById("more"))
		{
			more_url = document.getElementById("more").href;
			insert_update(more_url);
		}
		else if(document.getElementById("search_more"))
		{
			var more_url = document.getElementById("search_more").href;
			var more_click = document.createEvent('MouseEvents');
			more_click.initEvent( 'click', true, true );
			document.getElementById("search_more").dispatchEvent( more_click );
		}
		window.removeEventListener("scroll", function(){add_scroll_event()}, false);
		setTimeout(function(){during_pagination = false},500);
	}
}

// -- auto updater -- //
var auto_update = true;
var update_span = 60000;
var update_object = {};
var purge_expression = /public_timeline/;

if(!location.href.match(purge_expression))setInterval(function(){insert_update()}, update_span);

function insert_update()
{
	if(!arguments[0]){
		// insert update
		var real_timeline = document.getElementById("timeline");
		var insert_point = real_timeline.getElementsByClassName('hentry')[0];
		var active_timeline_url = document.getElementById('side').getElementsByClassName('active')[0].getElementsByClassName('in-page-link')[0].href;
		var top_status_id = active_timeline_url + "?twttr=true";
		var insert_point_id = insert_point.id.replace(/status_([0-9]+)/,"$1");
			insert_point_id += 0.1;
			insert_point_id -= 0.1;
		if( !active_timeline_url.match( /inbox/ ) )
		{
			check_inbox( 'message' );
		}
		if( !active_timeline_url.match( /replies/ ) )
		{
			check_inbox( 'mention' );
		}
	}
	else
	{
		// add next page
		var real_timeline = document.getElementById("timeline");
		var insert_point = real_timeline;
		var insert_point_id = 0.0;
		var top_status_id = arguments[0];
		var more_buton = null;
		if(document.getElementById("more"))
		{
			more_buton = document.getElementById("more");		
		}
		else if(document.getElementById("search_more"))
		{
			more_buton = document.getElementById("search_more");
		}
		var page_num = more_buton.href.match(/page\=([0-9]+)/)[1];
			page_num -= 0.0;
		var more_url = more_buton.href;
		more_buton.href = more_url.replace(/page\=[0-9]+/, ("page=" + (page_num + 1)));
	}
	var update_req = new XMLHttpRequest();
	update_req.onreadystatechange = function()
	{
		if(update_req.readyState == 4 && update_req.status == 200)
		{
			update_object = eval('(' + update_req.responseText + ')');
			var insert_HTML = update_object["#timeline"];
			var update_wrapper = document.createElement('div');
			update_wrapper.style.display = "none";
			update_wrapper.id = "pb_updater";
			update_wrapper.innerHTML = insert_HTML;
			document.getElementById("timeline").parentNode.appendChild(update_wrapper);
			var update_node_number = update_wrapper.childNodes[0].childNodes.length;
			for(var i = 0; i < update_node_number; i++ ){
				var updated_entry = update_wrapper.childNodes[0].childNodes[0];
				var updated_entry_id = updated_entry.id.replace(/status_([0-9]+)/,"$1");
					updated_entry_id += 0.1;
					updated_entry_id -= 0.1;

				while(updated_entry_id < insert_point_id && hasClass(insert_point, "mine")){
					insert_point = insert_point.nextSibling;
					while( !hasClass( insert_point , 'hentry' ) )
					{
						insert_point = insert_point.nextSibling;
					}
					insert_point_id = insert_point.id.replace(/status_([0-9]+)/,"$1");
					insert_point_id += 0.1;
					insert_point_id -= 0.1;
					// - debug -- addClass(insert_point, "pb-debug-insert");
				}
				// this try is for myself
				try{
					updated_entry.getElementsByClassName("reply")[0].name = updated_entry.getElementsByClassName("reply")[0].href;
					if(location.href.match(/twitter.com\/(timeline\/)*home/))
					{// home
						updated_entry.removeAttribute("href");
					}
					else
					{
						updated_entry.href = updated_entry.href.replace(/twitter.com\/(timeline\/)*[^\?]+/, "twitter.com/$1home");
						updated_entry.href = updated_entry.href.replace(/&amp;/g, "&");
					}

				} catch(err){
				}
				
				//update status text
				if(insert_point_id < updated_entry_id && hasClass(updated_entry,"mine") && (insert_point.id != "timeline") && (document.body.id != "profile")){
					document.getElementsByClassName("status-text")[0].innerText = updated_entry.getElementsByClassName("entry-content")[0].innerText;
				}
				
				//alert(insert_point_id);
				if( insert_point_id < updated_entry_id )
				{
					//add reply function
					try{
						updated_entry.getElementsByClassName("reply")[0].addEventListener("click", function(e){pb_reply(e);e.preventDefault()}, false);
					} catch(err){
					}
					//add face event
					try{
						updated_entry.getElementsByClassName("fav-action")[0].addEventListener("click", function(e){pb_fave(e);e.preventDefault()}, false);
					} catch(err){
					}
					//add destroy event
					try{
						updated_entry.getElementsByClassName("del")[0].addEventListener("click", function(e){pb_destroy(e);e.preventDefault();e.stopPropagation();}, false);
					} catch(err){
					}
					//update animation
					addClass(updated_entry,"animate");
					
					if( insert_point.id != "timeline" )
					{
						updated_entry.style.opacity = "0";
						updated_entry.style.marginTop = "-54px";
						insert_point.parentNode.insertBefore(updated_entry, insert_point);

						// latest status class change.
						if(insert_point.className.match(/latest\-status/))
						{
							insert_point.className = insert_point.className.replace(/latest\-status/g,"");
						}
						setTimeout(update_notification(updated_entry), 10);

						//update latest_mention_id
						if( !active_timeline_url.match( /replies/ ) )
						{
							latest_mention_id = updated_entry_id;
							set_storage_Value( 'pb_latest_mention_id' , latest_mention_id );
						}
		
						pb_latest_update = Date();
						
					}
					else
					{
						//only adding page.
						removeClass(updated_entry, "animate");
						real_timeline.appendChild(updated_entry);
					}
				}
				else if(insert_point_id == updated_entry_id)
				{
					updated_entry.parentNode.removeChild(updated_entry);
				}
				else
				{
					update_wrapper.parentNode.removeChild(update_wrapper);
					break;
				}
			}
			try
			{
				update_wrapper.parentNode.removeChild(update_wrapper);
			}
			catch(err)
			{
			}
		}
	};
	update_req.open('GET', top_status_id, true);
	update_req.setRequestHeader("Accept", "application/json, text/javascript, */*");
	update_req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	update_req.send(null);

	return false;
}

function check_inbox( type )
{
	if( arguments[1] )
	{
		var init_inbox = arguments[1];
	}
	else
	{
		var init_inbox = "";
	}
	switch ( type ) {
		case 'mention':
			var api_URL = window.location.protocol + "//twitter.com/replies";
			var latest_value = latest_mention_id;
			var latest_key = 'pb_latest_mention_id';
			if( latest_value == 0 )
			{
				latest_value = get_storage_Value( latest_key );
			}
			var target_element = "status";
			var regex_for_id = /status_([0-9]+)/;
			var message_priority = 0;
			break;

		case 'message':
			var api_URL = window.location.protocol + "//twitter.com/inbox";
			var latest_value = latest_message_id;
			var latest_key = 'pb_latest_message_id';
			if( latest_value == 0 )
			{
				latest_value = get_storage_Value( latest_key );
			}
			var target_element = "direct_message";
			var regex_for_id = /direct_message_([0-9]+)/;
			var message_priority = 1;
			break;
		default:	
	}
	
	var inbox = new XMLHttpRequest();
	inbox.onreadystatechange = function()
	{
		if(inbox.readyState == 4 && inbox.status == 200)
		{
			//latest_message_id = latest_value;
			var inbox_checker_container = document.createElement('div');
			inbox_checker_container.innerHTML = eval('(' + inbox.responseText + ')')["#timeline"];
			var messages = inbox_checker_container.getElementsByClassName( target_element );
			for( var i = 0 ; i < messages.length ; i++)
			{
				var message_id = messages[i].id.match( regex_for_id )[1];
				if(latest_value < message_id && latest_value != 0 && init_inbox == '')
				{
					var message_sender = inbox_checker_container.getElementsByClassName('screen-name')[i].innerText;
					var growl_message = {
						title : message_sender ,
						description : inbox_checker_container.getElementsByClassName('entry-content')[i].innerText ,
						priority: message_priority ,
						identifier: inbox_checker_container.getElementsByClassName('hentry')[i].id ,
						icon : inbox_checker_container.getElementsByClassName('photo')[i].src ,
					};
					if(typeof(window.fluid) != 'undefined' || window.fluid != null)
					{
						pb_growl(growl_message);
					}
					else
					{
						var existing_notification = document.getElementById( 'notifire_canvas' ).getElementsByClassName('Notifire').length;
						var notifire_id = inbox_checker_container.getElementsByClassName('hentry')[i].id + '';
						var notifire_delay = 10000 - ( existing_notification * 200 );
						new_notification( growl_message , existing_notification , notifire_delay );
					}
					add_unread( type , 1 );
				}
				else
				{
					break;
				}
			}
			latest_value = messages[0].id.match( regex_for_id )[1];
			set_storage_Value( latest_key , latest_value );
			latest_mention_id = get_storage_Value('pb_latest_mention_id');
			latest_message_id = get_storage_Value('pb_latest_message_id');
			inbox_checker_container = null;
		}
	}
	inbox.open('GET', api_URL, true);
	inbox.setRequestHeader("Accept", "application/json, text/javascript, */*");
	inbox.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	inbox.send(null);
}

function timeline_remover()
{
	var timeline_elements = document.getElementById('timeline').getElementsByClassName('hentry');
	var timeline = document.getElementById('timeline');
	var timeline_parent = timeline.parentNode;
	var new_timeline = document.createElement( 'ol' );
		new_timeline.setAttribute( 'class' , 'statuses new_tl' );
		new_timeline.id = 'new_timeline';
//		new_timeline.style.backgroundImage = 'url(http://a0.twimg.com/a/1252003675/images/loader.gif)';
//		new_timeline.style.backgroundPosition = 'center';
	timeline_parent.insertBefore( new_timeline , timeline );
	timeline_parent.removeChild( timeline );
		new_timeline.id = 'timeline';
	return;
}

function new_notification( messages , on_delay , off_delay )
{
	var new_notify = new Notifire();
	new_notify.description = messages.description;
	new_notify.icon = messages.icon;
	new_notify.priority = messages.priority;
	new_notify.pop_on(on_delay);
	setTimeout( function()
	{
		new_notify.push_off();
	}
	, off_delay
	);	
}

function add_unread( type , number)
{
	switch ( type ) {
		case 'home':
			alert('home');
			break;
		
		case'mention':
			unread_mentions -= 0;
			number -= 0;
			unread_mentions = unread_mentions + number;
			base_text = ' (' + unread_mentions + ')';
			document.getElementById('unread_counter_mention').innerHTML = base_text;
			break;

		case'message':
			unread_inbox -= 0;
			number -= 0;
			unread_inbox = unread_inbox + number;
			base_text = ' (' + unread_inbox + ')';
			document.getElementById('unread_counter_messages').innerHTML = base_text;
			break;
		
		default:
	}
	return;
}

function pb_link_maker(string)
{
	var source = string;
	var linked_source = source;
	if(!arguments[1]){
		linked_source = source.replace(/(https*\:\/\/[^\s\*\]\(\)]+)/g, "<a class='pb-link' href='$1' target='_blank'>$1</a>");
		linked_source = linked_source.replace(/blank\'\>([^\<]{28})[^\<]+\<\/a/g, "blank'>$1...</a");
		linked_source = linked_source.replace(/(\s+)\#([a-zA-Z0-9À-ȷ]+)(\s*)/g,"$1<a class='pb-link hashtag' href='" + window.location.protocol + "//twitter.com/search?q=%23$2' target='_blank'>#$2</a>$3");
	}
	linked_source = linked_source.replace(/\@([0-9a-zA-Z\_\-]+)/g,"@<a class='pb-link sname' href='" + window.location.protocol + "//twitter.com/$1' target='_blank'>$1</a>");
	//hashtag link
	return linked_source;
}

function pb_snip_retreiver(target)
{
	var snipMatch = /^(http\:\/\/tinyurl\.com\/[^\/]+|http\:\/\/bit\.ly\/[a-zA-Z0-9]+|http\:\/\/j\.mp\/[a-zA-Z0-9]+|http\:\/\/is\.gd\/.+|http\:\/\/ff\.im\/\-.+|http\:\/\/twurl\.nl\/.+)/;
	var links = target.getElementsByClassName('entry-content')[0].getElementsByTagName('a');
	for(var i = 0; i < links.length; i++)
	{
		if(links[i].href.match(snipMatch))
		{
			var snip_opener = pb_snip_url.cloneNode(true);
			snip_opener.name = links[i].href;
			snip_opener.id = guid();
			addClass(links[i], 'pb-snip-url');
			links[i].appendChild(snip_opener);
			links[i].addEventListener("mouseover", function(e){if(hasClass(e.target,'pb-snip-url')){pb_snip_expander(e.target)}}, false);
		}
	}
	return false;
}

function pb_link_remover(target)
{
	pb_temp_target = target.cloneNode(true);
	try
	{  // remove strong tag
		pb_temp_target.removeChild(pb_temp_target.getElementsByTagName('strong')[0]);
	} catch(err){
		//alert(err);
	}
	var pb_link = pb_temp_target.getElementsByTagName('a');
	//var num_pb_link = pb_link.length;
	var removed_str = "";
	for( var i = 0 ; i < pb_link.length ; i++ )
	{
		try
		{ //possible when real-url is exist.
			if( pb_link[i].innerText == '@' )
			{	// in order to remove search tab
				var atmark_span = document.createElement('span');
				atmark_span.innerHTML = '@' ;
				pb_link[i].parentNode.insertBefore( atmark_span , pb_link[i].nextSibling );
				pb_link[i].parentNode.removeChild( pb_link[i] );
			}
			if(!(hasClass(pb_link[i],'hashtag') || hasClass(pb_link[i],'sname') || pb_link[i].target != "_blank"))
			{
					pb_link[i].innerText = pb_link[i].href;
			}
		} catch(err) {}
	}
	removed_str = pb_temp_target.innerText;
	return removed_str;
}

function pb_snip_expander( target )
{
	var url_alias = target.getElementsByTagName('span')[0].name;
//	var snip_pattern = /http\:\/\/bit\.ly\/.+|http\:\/\/is\.gd\/.+|http\:\/\/twurl\.nl\/.+|http\:\/\/tinyurl\.com\/.+/;
	var snip_pattern = /http\:\/\/is\.gd\/.+|http\:\/\/twurl\.nl\/.+|http\:\/\/tinyurl\.com\/.+/;
	var bitly_pattern = /http\:\/\/(bit\.ly|j\.mp)\/[a-zA-Z0-9]+/;
	var ffim_pattern = /http\:\/\/ff\.im\/\-.+/;
	if( url_alias.match( snip_pattern ) )
	{	//search twitter.com JSONP
		var url_alias = url_alias;
		var id =  target.getElementsByTagName('span')[0].id;
		addClass(target.getElementsByTagName('span')[0],'loading');
	
		var turl_loader = document.createElement('script');
		turl_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=be222308568f5f81791af459f573e5a8&_render=json&urlinput=" + url_alias + "&parentid=" + id + "&_callback=pbTurlExp";
		document.getElementsByTagName("head")[0].appendChild(turl_loader);
	}
	else if( url_alias.match( ffim_pattern ) )
	{	//ffim JSONP
		var url_alias = target.getElementsByTagName('span')[0].name.match(/http\:\/\/ff\.im\/\-(.+)/)[1];
		var id =  target.getElementsByTagName('span')[0].id;
		addClass(target.getElementsByTagName('span')[0],'loading');
	
		var turl_loader = document.createElement('script');
		turl_loader.src = "http://pipes.yahoo.com/pipes/pipe.run?_id=c67eb2388cba44aa76667c00ae58aa88&_render=json&urlinput=" + url_alias + "&parentid=" + id + "&_callback=pbTurlExp";
		document.getElementsByTagName("head")[0].appendChild(turl_loader);
	}
	else if( url_alias.match(bitly_pattern) )
	{
		var url_alias = url_alias;
		var id =  target.getElementsByTagName('span')[0].id;
		var function_name = 'bitly' + id.replace( /\-/g , '');
		
		addClass(target.getElementsByTagName('span')[0],'loading');
		BitlyClient.expand( url_alias , function_name );

		//make bit.ly receiver
		bitly_receiver = document.createElement('script');
		bitly_receiver.innerHTML = "var " + function_name + " = function(data){ expandResponse(data , '" + id + "') }";
		document.getElementsByTagName("head")[0].appendChild(bitly_receiver);

	}
	
	return;
}

// kick animation to fix place
function kick_animation(target)
{
	var target = target;
	if(target.parentNode.nextSibling)
	{
		//if(target.parentNode.nextSibling.offsetTop < (window.scrollY - 200))
		if((target.parentNode.lastChild.offsetTop < (window.scrollY - 200)))
		{
			//alert('added upper scope');
			var curr_scroll_x = window.scrollX;
			var curr_scroll_y = window.scrollY;
			window.scrollTo(curr_scroll_x, (curr_scroll_y + target.offsetHeight));
			target.style.opacity = "1";
			target.style.marginTop = "5px";	
		}
		else if((target.parentNode.lastChild.offsetTop < (window.scrollY + window.innerHeight + 200)) && ((window.scrollY - 100) < target.parentNode.lastChild.offsetTop) )
		{
			target.style.opacity = "0";
			target.style.webkitTransition = "opacity 0.45s cubic-bezier(0.4, 0.0, 0.6, 0.4), margin-top 0.35s ease-out";
			var conv_script = document.createElement('script');
			conv_script.innerHTML = "setTimeout(function(){document.getElementById('" + target.id + "').style.opacity = '1';document.getElementById('" + target.id + "').style.marginTop = '5px';},200)";
			target.appendChild(conv_script);
		}
		else
		{
			target.style.opacity = "1";
			target.style.marginTop = "5px";
		}
	}
	else
	{
		//alert('end');
		target.style.opacity = "1";
		target.style.marginTop = "5px";
	}
}

function kick_animation_on_top(e)
{
	var target = e.target;
	var curr_scroll_x = window.scrollX;
	var curr_scroll_y = window.scrollY;
	if(target.nextSibling.offsetTop < (window.scrollY - 60))
	{	//upper than scope keep scropp position
		window.scrollTo(curr_scroll_x, (curr_scroll_y + 52));
		target.style.opacity = "1";
		target.style.marginTop = "0px";
		target.style.webkitTransition = "";
		removeClass(target, "animate");
		pbtweet_main([target]);
	}
	else
	{	// User can see animation
		target.style.webkitTransition = "opacity 0.3s ease-in, margin-top 0.2s ease-in";
		var conv_script = document.createElement('script');
		conv_script.innerHTML = "var target=document.getElementById('" + target.id + "'); setTimeout(function(){target.style.opacity = '1';target.style.marginTop = '0px'},10)";
		target.appendChild(conv_script);
		setTimeout(function(){target.style.opacity = "1";target.style.webkitTransition = "";target.style.marginTop = "0px";removeClass(target, "animate");pbtweet_main([target]);}, 1500);
	}
}

//reply button builder
function pb_extra_set(target)
{
	var my_pb_extra = pb_extra.cloneNode(true);
	var target_meta = target.getElementsByClassName('meta')[0];
	var my_in_reply_to_url = target_meta.getElementsByClassName('entry-date')[0].href;

	var my_reply_to = my_in_reply_to_url.match(/twitter\.com\/([^\/]+)/)[1];

	var my_pb_trans = my_pb_extra.getElementsByClassName('pb-trans')[0];

	var my_pb_rtwweet = my_pb_extra.getElementsByClassName('pb-rtweet')[0];
	var my_pb_via = my_pb_extra.getElementsByClassName('pb-via')[0];
	var my_pb_dm = my_pb_extra.getElementsByClassName('pb-dm')[0];

	
	if(document.getElementById('status_update_box'))
	{	//Add event only for status box
		my_pb_rtwweet.addEventListener("click", function(e){pb_reply(e,my_in_reply_to_url);}, false);
		my_pb_via.addEventListener("click", function(e){pb_reply(e,my_in_reply_to_url);}, false);
		my_pb_dm.addEventListener("click", function(e){pb_message(e,my_in_reply_to_url);}, false);
	}
	my_pb_trans.addEventListener("click", function(e){pb_translate(e);e.stopPropagation();e.preventDefault();}, false);


	//set parameter
	var tweet_string = pb_link_remover(target.getElementsByClassName('entry-content')[0]);
	my_pb_rtwweet.setAttribute('name',my_in_reply_to_url);
	my_pb_rtwweet.setAttribute('title',"RT @" + my_reply_to + ":");
	my_pb_rtwweet.innerHTML = "RT&nbsp;@:";
	my_pb_via.setAttribute('name',my_in_reply_to_url);
	my_pb_via.setAttribute('title',"via @" + my_reply_to + "");
	my_pb_via.innerHTML = "(via&nbsp;@)";
	my_pb_dm.setAttribute('name',my_in_reply_to_url);
	my_pb_dm.setAttribute('title',"send message to " + my_reply_to);

	if( !document.getElementById('status_update_box') )
	{
		my_pb_rtwweet.innerHTML = '<a href ="http://twitter.com/?status=' + 'RT @' + my_reply_to + ': ' + encodeURIComponent(tweet_string) + '">RT&nbsp;@:</a>';	
		my_pb_via.innerHTML = '<a href="http://twitter.com/?status=' + encodeURIComponent(tweet_string) + '(via @' + my_reply_to + ')">(via&nbsp;@)</a>';
		my_pb_dm.innerHTML =  "<a href='http://twitter.com/direct_messages/create/" + my_reply_to +"'>DM</a>";
		my_pb_rtwweet.addEventListener("click", function(e){protect_alert(my_reply_to);}, false);
		my_pb_via.addEventListener("click", function(e){protect_alert(my_reply_to);}, false);
		my_pb_dm.getElementsByTagName('a')[0].addEventListener("click", function(e){message_prohibition(my_reply_to);}, false);
	}
	
	target_meta.appendChild(my_pb_extra);
	
	return false;
}

function pb_appearance_set(target)
{
	var content_target = target;
	if(arguments[1]){
		var style_target = arguments[1];
	} else {
		var style_target = content_target;
	}
	var entry_string = content_target.getElementsByClassName('entry-content')[0].innerText;
	var mention_regex = new RegExp("@" + session_id);
	if(entry_string.match(mention_regex) && (!hasClass(style_target, 'mine'))){
		addClass(style_target, "pb-mention");
		if(hasClass(style_target.parentNode,"entry-baloon")){
			addClass( style_target.parentNode.getElementsByClassName('entry-content-before')[0], "pb-mention");
			addClass( style_target , "pb-mention" );
			addClass( style_target.parentNode.getElementsByClassName('entry-content-after')[0], "pb-mention");
		}
	}
	return false;
}

function pb_translate(event)
{
	var toEn_button = event.target;
	var target_container = toEn_button.parentNode.parentNode.parentNode.getElementsByClassName('entry-content')[0];
	var string_container = target_container.cloneNode(true);
	if(string_container.getElementsByClassName('pb-real-url')[0])
	{
		for(var i = 0;  i < string_container.getElementsByClassName('pb-real-url').length; i++)
		{
			string_container.getElementsByClassName('pb-real-url')[i].innerText = '';
		}
	}
	var original_string = string_container.innerText;
	if(!hasClass(target_container.parentNode,'entry-baloon')){
		if(target_container.parentNode.getElementsByTagName('strong')[0])
		{
			var tweeter_name = target_container.parentNode.getElementsByTagName('strong')[0].innerText;
		}
		else
		{
			var tweeter_name = "";
		}
		original_string = tweeter_name + ": " + original_string;
	} else {
		original_string = original_string.replace(/^([^\s]+)/,"$1: ");
	}
	var translator_Loader = document.createElement('script');
	translator_Loader.src = "http://www.google.com/uds/Gtranslate?callback=gTransExp&context=" + target_container.parentNode.parentNode.id.replace(/\-/g,"__") + "&q=" + encodeURIComponent(original_string) + "&key=notsupplied&v=1.0&nocache=1240207680396&langpair=%7C" + pb_lang;
	document.getElementsByTagName("head")[0].appendChild(translator_Loader);
	var entry_id = target_container.parentNode.parentNode.id;
	var original_container = document.getElementById(entry_id).getElementsByClassName('entry-content')[0];
	string_container = null;
	var translated_object = original_container.cloneNode(true);
		addClass(translated_object,'pb-translated');
		addClass(translated_object,'translate-loading');
		translated_object.innerHTML = "<img src='http://assets0.twitter.com/images/loader.gif'>";
		original_container.parentNode.insertBefore(translated_object, original_container.nextSibling);
		toEn_button.parentNode.removeChild(toEn_button);
}

function pb_changelang(event)
{
	var menu = event.target;
	pb_lang = menu.value;
	pb_trans.innerHTML = "to&nbsp;" + pb_lang.toUpperCase();
	var buttons = document.getElementsByClassName('pb-trans');
	set_storage_Value( 'pb_lang' , pb_lang ) ;
	for(var i = 0; i < buttons.length; i++)
	{
		buttons[i].innerHTML = "to&nbsp;" + pb_lang.toUpperCase();
	}
}

// reply function
function pb_reply(event)
{
	var target = event.target;
	var msg_body = "";
	var my_in_reply_to_url = "";

	var elm = document.getElementById("status");

	switch(event.target.className)
	{
		case "pb-rtweet":
			var in_reply_to_url = arguments[1];
			var reply_to = in_reply_to_url.match(/twitter\.com\/([^\/]+)\/status/)[1];
			var my_in_reply_to_url = in_reply_to_url.match(/\/status\/([0-9]+)$/)[1];
			elm.value = "RT @" + reply_to + ": " + pb_link_remover(target.parentNode.parentNode.parentNode.getElementsByClassName('entry-content')[0]);
			setTimeout( function(){protect_alert(reply_to)} , 1);
			break;
		case "pb-via":
			var in_reply_to_url = arguments[1];
			var reply_to = in_reply_to_url.match(/twitter\.com\/([^\/]+)\/status/)[1];
			var my_in_reply_to_url = in_reply_to_url.match(/\/status\/([0-9]+)$/)[1];
			elm.value = pb_link_remover(target.parentNode.parentNode.parentNode.getElementsByClassName('entry-content')[0]) + " (via @" + reply_to + " " + in_reply_to_url + ")";
			BitlyClient.shorten( in_reply_to_url , 'bitly_shorten_URL');
			setTimeout( function(){protect_alert(reply_to)} , 1);
			break;
		case "pb-all":
			var in_reply_to_url = arguments[1];
			var reply_to = in_reply_to_url.match(/twitter\.com\/([^\/]+)\/status/)[1];
			var my_in_reply_to_url = in_reply_to_url.match(/\/status\/([0-9]+)$/)[1];
			var id_remover = new RegExp("\@" + reply_to + "\ ");
			elm.value = elm.value.replace(id_remover,"");
			elm.value = "@" + reply_to + " " + elm.value;
			break;
		default:
			var in_reply_to_url = target.name;
			var reply_to = in_reply_to_url.match(/in\_reply\_to\=(.+)$/)[1];
			var my_in_reply_to_url = in_reply_to_url.match(/status\_id\=([0-9]+)\&/)[1];
			var id_remover = new RegExp("\@" + reply_to + "\ ");
			elm.value = elm.value.replace(id_remover,"");
			elm.value = "@" + reply_to + " " + elm.value;
	}
	
	document.getElementById("in_reply_to_status_id").value = my_in_reply_to_url;
	document.getElementById("in_reply_to").value = reply_to;

	elm.focus();
	elm.setSelectionRange(elm.value.length, elm.value.length);

	if(event.target.className == "pb-rtweet" || event.target.className == "pb-via" )
	{
		elm.setSelectionRange(0, 0);
	}
	
	return(false);
}

function pb_message(event)
{
	var target = event.target;
	var msg_body = "";
	var in_reply_to_url = arguments[1];
	
	var elm = document.getElementById("status");
	
	var reply_to = in_reply_to_url.match(/twitter\.com\/([^\/]+)\/status/)[1];

	var userinfo = fetch_user_info(reply_to);
	if(userinfo)
	{
		if( userinfo.following == false)
		{
			if( pb_lang != "ja")
			{
				alert(reply_to +" seems not your friend...");
			} else {
				alert(reply_to +"さんにはメッセージを送信できません。");			
			}
		} else {
			elm.value = "D " + reply_to + " ";
			elm.focus();
			elm.setSelectionRange(elm.value.length, elm.value.length);
		}
	}
	return(false);
}

function protect_alert(reply_to)
{
	var userinfo = fetch_user_info(reply_to);
	if(userinfo)
	{
		if( userinfo.protected == true )
		{
			if( pb_lang != "ja")
			{
				var alert_msg = reply_to + " is protected.\nTake care for retweeting " + reply_to + "'s tweet.";
			} else {
				var alert_msg = reply_to + "さんは発言を非公開にしています。\n引用を投稿する際には、非公開な発言であることに留意してください。";			
			}
			alert(alert_msg);
		} else {
		}
	}
	return;
}

function message_prohibition(send_to)
{
	var userinfo = fetch_user_info(send_to);
	if(userinfo)
	{
		if( userinfo.following == false)
		{
			if( pb_lang != "ja")
			{
				alert(reply_to +" seems not your friend...");
			} else {
				alert(reply_to +"さんにはメッセージを送信できません。");			
			}
		} else {
			return;
		}
	}
}

function shorten_url(target)
{
	if(!arguments[2] || arguments[2] == bitly_token)
	{
		var original_string = target.value;
		if(arguments[1] == 'all')
		{
			var url_detection_regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/g;
		}
		else
		{
			var url_detection_regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?\s/g;	
		}
		var shorten_url_detector = /bit\.ly|j.mp|tinyurl\.com|is\.gd|turl\/nl|ff\/.im\/|twitpic\.com|twitvid\.com|pic\.gd|movapic\.com|yfrog\.com|www\.bcphotoshare\.com|bkite\.com|tiny12\.com|tumblr\.com|flic\.kr|www\.flickr\.com|bctiny\.com|f\.hatena\.ne\.jp/;
		var match_url = original_string.match(url_detection_regexp);
		if(match_url)
		{
			for(var i = 0 ; i < match_url.length ; i ++)
			{
				if( !match_url[i].match(shorten_url_detector) && match_url[i].length >= 30 )
				{
					BitlyClient.shorten( match_url[i] , 'bitly_shorten_URL');
					//alert( bitly_token +":"+ arguments[2] );
				}
			}
		}
	}
}

// pb favorite function 
function pb_fave(event)
{
	var target = event.target;
	var target_id = target.id.match(/status\_star\_([0-9]+)/)[1];
	var fave_req = new XMLHttpRequest();
	var post_path = "create";
	if(hasClass(target,"fav")){
		post_path = "destroy";
		removeClass(target,"fav");
	} else if(hasClass(target,"non-fav")){
		post_path = "create";
		removeClass(target,"non-fav");	
	}
	fave_req.onreadystatechange = function(){
		if(fave_req.readyState == 4 && fave_req.status == 200){
			removeClass(target,"fav-throb");	
			if(post_path == "create"){
					addClass(target,"fav");
				} else if(post_path == "destroy"){
					removeClass(target,"non-fav");	
				}
			}
		}
	fave_req.open('POST', "/favorites/" + post_path + "/" + target_id , true);
	fave_req.setRequestHeader("Accept", "*/*");
	fave_req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	fave_req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	fave_req.send("authenticity_token=" + twttr.form_authenticity_token);
	addClass(target,"fav-throb");
	return(false);
}

function pb_destroy(event)
{
	if(confirm("Sure you want to delete this update? There is NO undo")){
		var target = event.target;
		var target_id = target.parentNode.childNodes[0].id.match(/status\_star\_([0-9]+)/)[1];
		var fave_req = new XMLHttpRequest();
		var post_path = "destroy";

		fave_req.onreadystatechange = function(){
			if(fave_req.status == 200){
					remove_redundand('status_' + target_id);
				}
			}
		fave_req.open('POST', "/status/" + post_path + "/" + target_id , true);
		fave_req.setRequestHeader("Accept", "application/json, text/javascript, */*");
		fave_req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		fave_req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
//		fave_req.send("authenticity_token=" + document.getElementById("authenticity_token").value);
		fave_req.send("authenticity_token=" + twttr.form_authenticity_token);
		addClass(target,"fav-throb");
	}//
	return(false);
}

// for Growl on Fluid.app
function update_notification(updated_entry)
{
	if(updated_entry.getElementsByClassName("screen-name")[0])
	{
		var author = updated_entry.getElementsByClassName("screen-name")[0].title;
		var avatar = updated_entry.getElementsByClassName("photo")[0].src;
	} else {
		var author = document.getElementById('profile').getElementsByClassName("fn")[0].innerText;
		var avatar = document.getElementById('profile-image').src;
	}
	
	var tweet = updated_entry.getElementsByClassName("entry-content")[0].innerText;
	var messages = {
		title: author,
		description: tweet,
		priority: -1,
		identifier: updated_entry.id,
		icon: avatar,
	};
	
	if(typeof(window.fluid) != 'undefined' || window.fluid != null)
	{
		pb_growl(messages);
	}
	else
	{
		var existing_notification = document.getElementById( 'notifire_canvas' ).getElementsByClassName('Notifire').length;
		var notifire_delay = 5000 - ( existing_notification * 130 );
		new_notification( messages , existing_notification , notifire_delay );
	}
	return;
}

function pb_growl(messages)
{
	window.fluid.showGrowlNotification({
		title: messages.title,
		description: messages.description,
		priority: messages.priority,
		identifier: messages.identifier,
		icon: messages.icon,
		onclick: function(){ window.fluid.activate() ;},
	});
	return;
}

function Notifire()
{
	var self = this;
	
	var card = document.createElement('div');
	card.setAttribute( 'class' , 'Notifire');
	card.id = guid();
	this.card = card;
	
	var icon_wrapper = document.createElement('div');
	icon_wrapper.setAttribute( 'class' , 'icon' );
	card.appendChild( icon_wrapper );
	
	var icon_image = document.createElement('img');
	icon_image.setAttribute( 'class' , 'icon' );
	icon_wrapper.appendChild( icon_image );
	this.icon_image = icon_image;
	
	var description = document.createElement('div');
	description.setAttribute( 'class' , 'description' );
	this.description_container = description;
	card.appendChild( description );
}

Notifire.prototype = 
{
	get notify_id ()
	{
		return this.card.id;	
	} ,
	
	set notify_id ( current_id )
	{
		this.card.id = current_id;
	} ,
	
	get icon ()
	{
		return this.icon_image.src;	
	} ,
	
	set icon ( src )
	{
		this.icon_image.src = src;
	} ,
	
	get description ()
	{
		return this.description_container.innerHTML;
	} ,
	
	set description ( x )
	{
		this.description_container.innerText = x;
	} ,

	get priority ()
	{
		this._priority;
	} ,
	
	set priority ( x )
	{
		this._priority = x;
		switch ( x ) {
			case -1:
				this.card.style.backgroundColor = 'rgba( 0 , 0 , 0, 0.75)';
				break;
			
			case 0:
				this.card.style.backgroundColor = 'rgba( 60 , 10 , 20 , 0.75)';
				break;
			
			case 1:
				this.card.style.backgroundColor = 'rgba( 80 , 0 , 0 , 0.75)';
				break;
				
			default:
				this.card.style.backgroundColor = 'rgba( 24 , 24 , 24 , 0.75)';
				return;
		}
		return;
	} ,	
	
	pop_on : function(delay)
	{
		document.getElementById( 'notifire_canvas' ).appendChild( this.card );
		var my_id = this.notify_id;
		setTimeout( function()
			{
				addClass( document.getElementById(my_id) , 'Notifire-popon' );
			} , delay * 200 );
		return;
	} ,
	
	push_off : function()
	{
		addClass( this.card , 'Notifire-pushout' );
		if( !arguments[0] )
		{
			var my_id = this.notify_id;
//			window.console.log = window.console.log + 'remove id:' + my_id + '\n';
		}
		else
		{
			var my_id = arguments[0];
//			window.console.log = window.console.log + 'remove id:' + my_id + '\n';
		}
		setTimeout( function()
			{
				document.getElementById('notifire_canvas').removeChild( document.getElementById( my_id ) );
//				window.console.log = window.console.log + 'removed:' + my_id + '\n';
				delete this;
			} , 300 );
		return;
	} ,
}

function pb_group_tab()
{	//create group
	var pb_hr = document.createElement('hr');

	var pb_group_wrapper = document.createElement('div');
		pb_group_wrapper.id = 'pb-group';
		pb_group_wrapper.className = 'collapsible';
	var pb_group_title = document.createElement('h2');
		pb_group_title.className = 'sidebar-title';
		pb_group_title.innerHTML = '<span>Groups</span>';
	var pb_group_list = document.createElement('ul');
		pb_group_list.className = 'sidebar-menu';
	var pb_group_add_button = document.createElement('a');
		pb_group_add_button.className = 'xref';
		pb_group_add_button.innerHTML = 'add';
	pb_group_list.appendChild( pb_group_add_button );
	pb_group_title.appendChild( pb_group_add_button );

	pb_group_wrapper.appendChild(pb_group_title);
	pb_group_wrapper.appendChild(pb_group_list);
	pb_group_wrapper.appendChild( pb_hr );
	pb_group_add_button.addEventListener('click', function(e){pb_add_group(e.target.parentNode);e.stopPropagation;e.preventDefault()}, false);
	document.getElementById('side').insertBefore( pb_group_wrapper, document.getElementById('rssfeed'));
	document.getElementById( 'following' ).appendChild( pb_hr );
}

function pb_grouping(group)
{	//
	if(pb_active_group != group || arguments[1] == 'keep')
	{
		removeClass(pb_active_group, 'pbActiveGroup');
		pb_active_group = group;
		var elements = document.getElementById('timeline').getElementsByClassName('hentry');
		var group_list = group.getElementsByClassName('vcard');
		var isInGroup = new RegExp(group.inGroup);
		//alert(isInGroup);
		for(var i = 0; i < elements.length; i++)
		{
			var target_u_name = elements[i].className.match(/u-([a-zA-Z0-9\_\-]+)/)[1];
			if(target_u_name.match(isInGroup))
			{
				removeClass(elements[i], 'pbHiddenGroup');				
			}
			else
			{
				hide_group(elements[i].id, '', i * 200);
			}
		}
		addClass(group, 'pbActiveGroup');
	}
	else
	{
		setTimeout(function(){pb_remove_grouping()}, 100);
	}
}

function pb_in_group_regexp(group)
{
	var regrep_string = '';
	var group_list = group.getElementsByClassName('vcard');
	for(var j = 0; j < group_list.length; j++)
	{
		var g_name = group_list[j].getElementsByClassName('url')[0].href.replace(/.+twitter.com\/(.+)/, '$1');
		regrep_string = regrep_string + '|^' + g_name + '$';
	}
	var return_regExp = new RegExp(regrep_string.replace(/^\|/, ''));
	return return_regExp;
}

function pb_is_in_group(target)
{
	var is_in_group = true;
	if(pb_active_group != null)
	{
		is_in_group = false;
		var target_u_name = target.className.match(/u\-([a-zA-Z0-9\_\-]+)/)[1];
		var group_list = pb_active_group.getElementsByClassName('vcard');
		for(var j = 0; j < group_list.length; j++)
		{
			var g_name = group_list[j].getElementsByClassName('url')[0].href.replace(/.+twitter.com\/(.+)/, '$1');
			if(target_u_name == g_name)
			{
				is_in_group = true;
				break;
			}
		}
	}
	return(is_in_group);
}

function pb_remove_grouping()
{
	var group = pb_active_group;
	removeClass(group, 'pbActiveGroup');
	var elements = document.getElementById('timeline').getElementsByClassName('hentry');
	for(var i = 0; i < elements.length; i++)
	{
		var target_id = elements[i].id;
		setTimeout(function()
		{
			pb_removing_timer(target_id)
		}, i*100);
	}
	pb_active_group = null;
}

function pb_removing_timer( target_id )
{
	var target = document.getElementById(target_id);
		removeClass(target, 'pbHiddenGroup');
}

function pb_add_group(wrapper)
{
	var insert_point = wrapper;
	var pb_group = document.createElement('li');
		pb_group.className = 'link-title' ;
	var pb_group_button = document.createElement('a');
		pb_group_button.href = '#';
		pb_group_button.innerHTML = '<span>Group</span>';
	var pb_add_member_to_group_button = document.createElement('span');
		pb_add_member_to_group_button.innerHTML = '+';
		pb_add_member_to_group_button.className = 'pb-group-action';
	pb_group_button.getElementsByTagName('span')[0].appendChild(pb_add_member_to_group_button);
	pb_group_button.addEventListener('click', function(e){pb_grouping(pb_group);e.stopPropagation();e.preventDefault()}, false);
	pb_add_member_to_group_button.addEventListener('click', function(e){pb_add_member_to_group_panel(pb_group);e.preventDefault();e.stopPropagation()}, true);
	pb_group.appendChild(pb_group_button);
	insert_point.parentNode.getElementsByClassName('sidebar-menu')[0].appendChild(pb_group);
	pb_add_member_to_group_panel(pb_group);
	//return pb_group;
}

function pb_add_member_to_group(target)
{
	var target = target;
	var vcard_container = target.getElementsByClassName('following')[0];
	if( !vcard_container )
	{
		var pb_group_vcards = document.createElement('div');
			pb_group_vcards.className = 'following' ;
		target.appendChild(pb_group_vcards);
		var vcard_container = pb_group_vcards;
	}

	if( arguments[1] != '' )
	{
		var u_name_list = arguments[1].split(/[^0-9a-zA-Z\-\_]+/);
		for( var i = 0 ; i < u_name_list.length ; i++ )
		{
			setTimeout( vcard_container.appendChild( vcard_builder( u_name_list[i] ) ) , 100 );
		}
		target.inGroup = pb_in_group_regexp(target);
		//pb_grouping(target,'keep');
	}
	pb_add_member_panel_close(target.getElementsByClassName('pb-add-group')[0]);
}

function pb_add_member_to_group_panel(target_group)
{
	if(!target_group.getElementsByClassName('pb-add-group')[0])
	{	// Group should open once.
		var input_field_wrapper = document.createElement('div');
			input_field_wrapper.className = 'pb-add-group';
		var input_field = document.createElement('input');
			input_field.className = 'uname';
		var add_button = document.createElement('input');
			add_button.type = 'button';
			add_button.value = 'Add';
		var cancel_button = document.createElement('input');
			cancel_button.type = 'button';
			cancel_button.value = 'Cancel';
	
			input_field_wrapper.appendChild(input_field);
			input_field_wrapper.appendChild(cancel_button);
			input_field_wrapper.appendChild(add_button);
		
		add_button.addEventListener('click', function(e){pb_add_member_to_group(target_group, input_field.value);e.stopPropagation()}, false);
		cancel_button.addEventListener('click', function(e){pb_add_member_panel_close(input_field_wrapper);e.stopPropagation()}, false);
		target_group.appendChild(input_field_wrapper); 
	}
}

function pb_add_member_panel_close(target)
{
	var target = target;
	target.parentNode.removeChild(target);
}

function vcard_builder(uname)
{	// current, text vcard
	var userinfo = fetch_user_info(uname);
	if(userinfo)
	{
		var vcard = document.createElement('span');
			vcard.className = 'vcard';
		var vcard_url = document.createElement('a');
			vcard_url.className = 'url';
			vcard_url.rel = 'contact';
			vcard_url.target = '_blank';
			vcard_url.href = '/' + uname;
		var vcard_avater = document.createElement('img');
			vcard_avater.src = userinfo.profile_image_url;
			vcard_avater.className = 'photo fn';
			vcard_avater.width = '24';
			vcard_avater.height = '24';
			vcard_url.appendChild(vcard_avater);
		vcard.appendChild(vcard_url);
		//target.appendChild(vcard);
		return(vcard);
	}
	else
	{
		return(null);	
	}
}

function vcard_append( userinfo , target )
{

}

function fetch_user_info(uname)
{
	var request = new XMLHttpRequest();
	var url = '/users/' + uname +'.json';
	request.open('GET', url, false);
	request.setRequestHeader("Accept", "application/json, text/javascript, */*");
	request.send(null);
	var conv_object = eval('(' + request.responseText + ')');
	return( conv_object );
}

function pb_info_panel()
{	//create information panel
	var pb_nav = document.createElement('li');
	pb_nav.id = 'pb_info';
	pb_nav.innerHTML = '<a href="">pbtweet</a>';
	var pbtweet_icon = '<div style="display:block;text-align:center;"><img src="http://s3.amazonaws.com/twitter_production/profile_images/184416700/icon_bigger.png"><br><a href="http://web.me.com/t_trace/pbtweet.html" target="_blank">pbtweet Web</a></div>';
	var lang_menu = '<select name="tl" id="pb_translation_target"><option value="af">Afrikaans</option><option value="sq">Albanian</option><option value="ar">Arabic</option><option value="be">Belarusian</option><option value="bg">Bulgarian</option><option value="ca">Catalan</option><option value="zh-CN">中文 (簡体)</option><option value="zh-TW">中文 (繁体)</option><option value="hr">Croatian</option><option value="cs">Czech</option><option value="da">Danish</option><option value="nl">Dutch</option><option selected="" value="en">English</option><option value="et">Estonian</option><option value="tl">Filipino</option><option value="fi">Finnish</option><option value="fr">French</option><option value="gl">Galician</option><option value="de">German</option><option value="el">Greek</option><option value="iw">Hebrew</option><option value="hi">Hindi</option><option value="hu">Hungarian</option><option value="is">Icelandic</option><option value="id">Indonesian</option><option value="ga">Irish</option><option value="it">Italian</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="lv">Latvian</option><option value="lt">Lithuanian</option><option value="mk">Macedonian</option><option value="ms">Malay</option><option value="mt">Maltese</option><option value="no">Norwegian</option><option value="fa">Persian</option><option value="pl">Polish</option><option value="pt">Portuguese</option><option value="ro">Romanian</option><option value="ru">Russian</option><option value="sr">Serbian</option><option value="sk">Slovak</option><option value="sl">Slovenian</option><option value="es">Spanish</option><option value="sw">Swahili</option><option value="sv">Swedish</option><option value="th">Thai</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option><option value="vi">Vietnamese</option><option value="cy">Welsh</option><option value="yi">Yiddish</option></select>';
	var chonv_count_menu = '<select name="conv_count"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="999">infinite</option></select>';
	var accesskey_enablity = '<input id="pbaccess" name="pbaccess" type="checkbox"><label  for="pbaccess">enable accesskey</label>';
	accesskey_enablity = '';
	
	var pb_panel = document.createElement('div');
	pb_panel.id = 'pb_panel';
	pb_panel.innerHTML = pbtweet_icon + '<br><br>version: ' + pb_version + '<br><form>translate to: '+ lang_menu + '<br>max conversation: ' + chonv_count_menu + '<br>' + accesskey_enablity + '</form><br><a href="http://web.me.com/t_trace/pbtweet/pbtweet_dev.user.js" target="_blank">update to latest version</a><br><img src="http://search.twitter.com/images/powered-by-twitter-sig.gif?1220915084"><br>Powerd by Yahoo! Pipes<br>Powerd by Google<br><input type="button" value="close">';
	
	pb_nav.appendChild(pb_panel);
	
	pb_nav.addEventListener('click', function(e){pb_panel.style.webkitTransform="scale(1, 1)";pb_panel.style.opacity = "1";e.preventDefault();},false);
	pb_nav.getElementsByTagName('a')[1].addEventListener('click', function(e){e.stopPropagation();},false);
	pb_nav.getElementsByTagName('select')[0].addEventListener('change', function(e){pb_changelang(e);},true);
	pb_nav.getElementsByTagName('select')[1].addEventListener('change', function(e){chain_count = e.target.value; set_storage_Value( 'pb_chain_count' , chain_count ) ; } , true );
	pb_panel.getElementsByTagName('input')[0].addEventListener('click', function(e){pb_panel.style.opacity = "0";pb_panel.style.webkitTransform = "scale(0.2, 0)";e.preventDefault();e.stopPropagation()},true);

	menu_init(pb_nav.getElementsByTagName('select')[0] , pb_lang );
	menu_init(pb_nav.getElementsByTagName('select')[1] , chain_count );
	
	document.getElementById('header').getElementsByTagName('ul')[0].insertBefore(pb_nav, document.getElementById('header').getElementsByTagName('li')[5]);
}

function menu_init(target, value)
{
	var option_list = target.getElementsByTagName('option');
	for( var i = 0 ; i < option_list.length ; i++ )
	{
		if(option_list[i].value == value)
		{
			option_list[i].selected = true;
			break;
		}
	}
}

function remove_accesskey()
{
	if(!enable_accesskey){
		var target_list = document.getElementById('primary_nav').getElementsByTagName('a');
		for(var i = 0; i < target_list.length ; i++ )
		{
			target_list[i].accessKey = "";
		}
	}
}

//Client side storage handler
function restore_pb_values()
{
	chain_count = get_storage_Value('pb_chain_count') ? get_storage_Value('pb_chain_count') : 4;
	pb_lang = get_storage_Value('pb_lang') ? get_storage_Value('pb_lang') : navigator.language.substr(0,2);
	enable_accesskey = get_storage_Value('pb_enable_accesskey') ? get_storage_Value('pb_enable_accesskey') : false;
	latest_mention_id = get_storage_Value('pb_latest_mention_id') ? get_storage_Value('pb_latest_mention_id') : 0;
	latest_message_id = get_storage_Value('pb_latest_message_id') ? get_storage_Value('pb_latest_message_id') : 0;
	unread_inbox = get_storage_Value('pb_unread_inbox') ? get_storage_Value('pb_unread_inbox') : 0;
	unread_mentions = get_storage_Value('pb_unread_mentions') ? get_storage_Value('pb_unread_mentions') : 0;

	window.onbeforeunload = function ()
	{
		return save_storage_Changes();
	};
}

function clearAll()
{
	localStorage.clear();
	restore_pb_values();
}

function set_storage_Value(key, value)
{
	if ( is_localstorage() )
	{
		localStorage.setItem( key, value );
		//sessionStorage.setItem(value, document.getElementById(value).value);
	}
	else
	{
		document.cookie = key + "=" + value + ";path=/;expires = Thu, 1-Jan-2030 00:00:00 GMT;" ;
	}
}

function get_storage_Value(key)
{
	if ( is_localstorage() )
	{
		return( localStorage.getItem(key) );
	}
	else
	{
		var cookies = document.cookie.split("; ");
		for ( var i = 0 ; i < cookies.length ; i++ )
		{
			var str = cookies[i].split("=");
			if ( str[0] == key ) {
				return( unescape( str[1] ) );
				break ;
			}
		}
	}
}

function save_storage_Changes()
{
	set_storage_Value('pb_chain_count', chain_count);
	set_storage_Value('pb_lang', pb_lang);
	set_storage_Value('pb_latest_mention_id', latest_mention_id);
	set_storage_Value('pb_latest_message_id', latest_message_id);
	set_storage_Value('pb_unread_mentions', unread_mentions);
	set_storage_Value('pb_unread_inbox', unread_inbox);
	return null;
}

function clearValue(value)
{
	if (value == 'myfield1')
	{
		sessionStorage.removeItem(value);
	}
	else
	{
		localStorage.removeItem(value);
	}
	document.getElementById(value).value = '';
}

function is_localstorage()
{
	if (typeof(sessionStorage) == 'undefined' || sessionStorage == null || typeof(localStorage) == 'undefined' || localStorage == null)
	{
		return(false);
	}
	else
	{
		return(true);
	}
}

function load_localscript()
{
	var global_functions = document.createElement('script');
	global_functions.src = "http://web.me.com/t_trace/pbtweet/pbtweet_global_dev.js";
	document.getElementsByTagName("head")[0].appendChild(global_functions);
}

function pb_css_set()
{
	var insert_HTML = '';
	var get_url = '';
	var oLength = document.styleSheets[0].cssRules.length;
	document.styleSheets[0].insertRule('div.conv_chain {clear:both; text-align:left;margin: 5px 5px 4px 0px; padding:0px 0px 0px 0px;}',oLength);
	document.styleSheets[0].insertRule('div.conv_chain div.thumb{width: 34px !important; height: 34px !important; position:relative !important;max-width:100px;}',oLength+1);
	document.styleSheets[0].insertRule('div.conv_chain div.thumb img{vertical-align:top; margin-right:4px !important;width:60px !important;max-width:60px !important;height:32px !important;}',oLength+2);
	document.styleSheets[0].insertRule('div.conv_chain span.icons{display:inline-block;margin-left:15px;text-align:center;padding:0px 0px 10px 0px;width:50px !important;max-width:50px !important;}',oLength+3);
	document.styleSheets[0].insertRule('div.conv_chain span.icons img{max-width:40px;max-height:40px;}',oLength+4);
	document.styleSheets[0].insertRule('div.conv_chain span.icons a:hover {text-underline: none;}',oLength+5);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content, body#show #content div.conv_chain span.entry-content{display:block;width:400px;max-width:400px;min-height:24px;margin:0px 0px 0px 0px;padding:0px 12px 0px 16px;vertical-align:top;background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_02.png); background-repeat:repeat-y;}',oLength+6);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content-before{display:block;width:400px;max-width:400px; height:12px;margin:0px 0px 0px 0px;padding:0px 6px 0px 16px;vertical-align:top;background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_01.png); background-repeat:no-repeat;}',oLength+7);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content-after {display:block;width:400px;max-width:400px; height:25px;margin:0px 0px -10px 0px;padding:0px 6px 0px 16px;vertical-align:top;background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_03.png); background-repeat:no-repeat; background-position:0px -4px;}',oLength+8);
	document.styleSheets[0].insertRule('div.conv_chain span.meta.entry-meta {clear:right; display:block;padding-left:24px; height:10px; margin-top:4px}',oLength+9);
	document.styleSheets[0].insertRule('.hentry img.twitpic_thumb {display:block;position:absolute;left:500px;top:0px;z-index:100;width:100px;heigt100px;border:7px solid white;-webkit-box-shadow:0px 3px 5px rgba(0, 0, 0, 0.7);-webkit-transform:scale(0.4) rotate(17deg); -webkit-transform-origin:50% 0%;-webkit-transition:-webkit-transform 0.15s ease-in;}',oLength+10);
	document.styleSheets[0].insertRule('.hentry img.twitpic_thumb:hover {z-index:101;-webkit-transform:scale(1) rotate(0deg);}',oLength+11);
	document.styleSheets[0].insertRule('div.conv_chain img.twitpic_thumb {position:absolute;left:435px; top:inherit;margin-top:-35px;-webkit-transform-origin:50% 0%;-webkit-transform:scale(0.3) rotate(17deg);}',oLength+12);
	document.styleSheets[0].insertRule('div.conv_chain img.twitpic_thumb:hover {-webkit-transform-origin:50% 0%;-webkit-transform:scale(1) rotate(0deg);}',oLength+13);
	document.styleSheets[0].insertRule('img.twitpic_thumb {display:block;position:absolute;z-index:900;width:100px;heigt100px;border:7px solid white;-webkit-box-shadow:0px 3px 5px rgba(0, 0, 0, 0.7);-webkit-transform:translate(490px, -30px) scale(0.4) rotate(17deg); -webkit-transform-origin:50% 0%;-webkit-transition:-webkit-transform 0.15s ease-in;}',oLength+14);
	document.styleSheets[0].insertRule('img.twitpic_thumb:hover {-webkit-transform: translate(490px, -30px) scale(1) rotate(0deg);}',oLength+15);
	document.styleSheets[0].insertRule('div.conv_chain .actions, body#show div.conv_chain .actions {display:inline; visibility: hidden;padding-top:4px ; float:right; width:14px;line-height:0.8em; position:inherit;}',oLength+16);
	document.styleSheets[0].insertRule('div.conv_chain:hover .actions, body#show div.conv_chain:hover .actions {visibility: visible;}',oLength+17);
	document.styleSheets[0].insertRule('div.conv_chain .actions .pb-reply {padding:4px 6px; background-image: url(http://static.twitter.com/images/icon_reply.gif);}',oLength+18);
	document.styleSheets[0].insertRule('div.conv_chain .actions .pb-fav-action {padding:4px 6px;}',oLength+19);
	document.styleSheets[0].insertRule('span.pb-extra span {display:inline-block;box-sizing: content-box; height: 14px; font-size: 10px ;cursor:pointer; margin:0px 3px 5px 3px;padding:1px 6px;border:1px solid #cccccc; -webkit-border-radius: 4px;background:-webkit-gradient(linear, left top, left bottom, from(#fff), to(#eee), color-stop(0.1, #fff)); -webkit-transition:-webkit-box-shadow 0.1s ease-in, color 0.1s ease-in, background 0.1s ease-in;}',oLength+20);
	document.styleSheets[0].insertRule('li.status span.pb-extra, div.conv_chain span.pb-extra {opacity: 0; -webkit-transition:opacity 0.3s ease-in;}',oLength+21);	
	document.styleSheets[0].insertRule('li.status:hover span.status-body span.meta span.pb-extra, div.conv_chain:hover span.pb-extra {opacity: 1;}',oLength+22);
	document.styleSheets[0].insertRule('span.pb-extra span:hover {-webkit-box-shadow:0px 2px 3px rgba(0, 0, 0, 0.5);color:#444;background:-webkit-gradient(linear, left top, left bottom, from(#fff), to(#ccc), color-stop(0.1, #fff));}',oLength+23);
	document.styleSheets[0].insertRule('span.pb-extra {display:block;color:#ccc;position:absolute;width:190px;height:12px;margin-left:230px;margin-top:-12px; text-align:right;  font-style:normal; font-family:sans-serif;}',oLength+24);
	document.styleSheets[0].insertRule('span.meta.entry-meta {margin-top:5px;}',oLength+25);
	document.styleSheets[0].insertRule('ol.statuses li {opacity: 1}',oLength+26);
	document.styleSheets[0].insertRule('#pb_panel {position:absolute;top:0px;left: -140px;z-index:9999; padding:4px;background:white; -webkit-box-shadow:0px 4px 8px #888;opacity: 0; -webkit-transform: scale(0.2, 0); -webkit-transition:-webkit-transform 0.2s ease-in, opacity 0.3s ease-in;-webkit-transform-origin:100% 0%}',oLength+27);

	//coloring for mine or pb-mention //
	document.styleSheets[0].insertRule('ol.statuses li.pb-mention {background-color:rgb(96%,100%,100%);}',oLength+28);
	document.styleSheets[0].insertRule('ol.statuses li.pb-mention:hover {background-color:rgb(88%,95%,99%);}',oLength+29);
	document.styleSheets[0].insertRule('ol.statuses li.mine {background-color:rgb(93%,100%,96%);}',oLength+30);
	document.styleSheets[0].insertRule('ol.statuses li.mine:hover {background-color:rgb(91%,100%,93%);}',oLength+31);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content.mine {background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_mine_02.png) !important;}',oLength+32);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content.pb-mention{background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_mention_02.png) !important;}',oLength+33);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content-before.mine { height:12px;background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_mine_01.png)}',oLength+34);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content-before.pb-mention{ height:12px;background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_mention_01.png)}',oLength+35);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content-after.mine { height:25px;background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_mine_03.png)}',oLength+36);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-content-after.pb-mention{ height:25px;background-image:url(http://web.me.com/t_trace/pbtweet/images/baloon_mention_03.png)}',oLength+37);
	
	//debug-css//
	document.styleSheets[0].insertRule('.pb-debug-insert {background-color:red !important;}',oLength+38);
	document.styleSheets[0].insertRule('div#footer {position:fixed; bottom:-20px; z-index:900; text-align:center; margin:0px auto 0px 140px;-webkit-box-shadow:0px 3px 5px rgba(0, 0, 0, 0.75);-webkit-transition:bottom 0.2s ease-in;}',oLength+39);
	document.styleSheets[0].insertRule('div.conv_chain span.entry-baloon {display:inline-block;width:422px;max-width:422px;vertical-align:bottom;margin:0px 0px 0px 0px;}',oLength+40);
	document.styleSheets[0].insertRule('ol#timeline {padding-left:0px !important;}',oLength+41);
	
	document.styleSheets[0].insertRule('span.pb-extra span.pb-rtweet a:hover, span.pb-via a:hover, span.pb-dm a:hover {text-decoration : none;}',oLength+42);
	document.styleSheets[0].insertRule('div#footer:hover {bottom: 0px;}',oLength+43);

	// for snip url
	document.styleSheets[0].insertRule('a.pb-snip-url {display:inline-block;margin:-3px -4px; padding: 1px 4px; border:1px solid transparent; text-decoration:none; -webkit-border-top-left-radius: 5px 5px;-webkit-border-top-right-radius: 5px 5px; -webkit-transition:background 0.2s ease-in, width 0.2s ease-in;}',oLength+44);
	document.styleSheets[0].insertRule('a.pb-snip-url:hover {display:inline-block; border:1px solid #999; background-color: #ccc; text-decoration:none; background:-webkit-gradient(linear, left top, left bottom, from(#fff), to(#eee), color-stop(0.1, #fff));}',oLength+45);
	document.styleSheets[0].insertRule('a.pb-snip-url span {display:block; opacity: 0; position:absolute ;min-width:250px; min-height: 16px;margin:0px 0px 0px -5px;padding: 5px 5px; background-color: white; text-decoration:underline; -webkit-box-shadow: 0px 4px 4px rgba(0%, 0%, 0%, 0.4);-webkit-transform:scale(0, 0);-webkit-transform-origin:0% 0%; -webkit-transition: width 0.2s ease-in, -webkit-transform 0.3s ease-in;}',oLength+46);
	document.styleSheets[0].insertRule('a.pb-snip-url:hover span {opacity: 1; position:absolute ; z-index: 950;border:1px solid #999; background-color: white; text-decoration:underline;-webkit-transform:scale(1, 1);}',oLength+47);
	document.styleSheets[0].insertRule('a.pb-snip-url:hover span.loading {background-image:url(http://assets0.twitter.com/images/loader.gif)}',oLength+48);

	document.styleSheets[0].insertRule('ol.statuses span.status-body {overflow: inherit !important;}',oLength+49);
	document.styleSheets[0].insertRule('.status-body > .pb-translated {display:block; border-top:1px dotted silver; color:#555; margin-top: 4px; padding-top:4px;}',oLength+50);
	document.styleSheets[0].insertRule('.entry-baloon > .pb-translated {border:none; color:#555; padding-top: 4px;}',oLength+51);
	document.styleSheets[0].insertRule('.translate-loading {text-align:center;}',oLength+52);
	document.styleSheets[0].insertRule('div.conv_chain .pb-extra {width:190px; margin-left:200px;}',oLength+53);
	document.styleSheets[0].insertRule('span.pb-extra .pb-trans {margin-right: 4px; height:12px;-webkit-border-radius:6px 6px; -webkit-transition:background 0.2s ease-in, color 0.2s ease-in;}',oLength+54);
	document.styleSheets[0].insertRule('span.pb-extra .pb-trans:hover {color: #444; border:1px solid white; background-color:rgb(99%,92%,39%); background: -webkit-gradient(linear, left top, left bottom, from(#fff), to(rgb(88%,75%,19%)), color-stop(0.1, rgb(97%,94%,38%)));}',oLength+55);
	document.styleSheets[0].insertRule('#profile ol.statuses li.status .status-body > .entry-meta {margin-left:63px;}',oLength+56);

	document.styleSheets[0].insertRule('body#profile ol.statuses .latest-status .conv_chain .entry-baloon .entry-content {font-size: 1em;}',oLength+57);

	document.styleSheets[0].insertRule('ul.sidebar-menu li a span.pb-group-action {float:right;width:10px;}',oLength+58);
	document.styleSheets[0].insertRule('ol.statuses li.status.pbHiddingGroup {-webkit-transform: scale(1, 0);}',oLength+59);
	document.styleSheets[0].insertRule('ol.statuses li.status.pbHiddenGroup, ol.statuses li.status.pbInConv {display:none;}',oLength+60);
	document.styleSheets[0].insertRule('.pbActiveGroup {background-color:white !important;}',oLength+61);
	document.styleSheets[0].insertRule('div#pb-group span.vcard {padding : 0px 3px 2px 1px;}',oLength+62);
	document.styleSheets[0].insertRule('div#pb-group li span.vcard a.url { display : inline ; background-color:transparent !important; padding: 0px;}',oLength+63);
	document.styleSheets[0].insertRule('.pb-add-group input.uname {display:block; width: 157px;margin:1px 14px; padding:1px 2px;}',oLength+64);
	document.styleSheets[0].insertRule('.pb-add-group {display:block; margin:1px 3px; padding-right:14px; text-align:right;}',oLength+65);
	document.styleSheets[0].insertRule('div#pb-group .following { padding: 5px 10px 5px 14px; }',oLength+66);
	document.styleSheets[0].insertRule('.xref {margin-left:5px;}',oLength+67);

	document.styleSheets[0].insertRule('.conv-read-more {padding : 4px; font-size : 12px; text-align: center; font-weight:bold; color: #999; cursor:pointer; border: 1px solid #ccc; -webkit-border-radius: 4px; background-color: white; background:-webkit-gradient(linear, left top, left bottom, from(#fff), to(#eee), color-stop(0.1, #fff)); background-repeat : no-repeat; background-position: center;}',oLength+68);
	document.styleSheets[0].insertRule('.conv-read-more:hover {color: #555; cursor:pointer; -webkit-box-shadow: 0px 4px 4px rgba(0%, 0%, 0%, 0.4)}',oLength+69);

	document.styleSheets[0].insertRule('.Notifire { margin-left: 13px; margin-top: 10px; width: 450px ; min-height: 40px; clear : both ; -webkit-box-shadow: 0px 4px 4px rgba(0%, 0%, 0%, 0.4) ; -webkit-border-radius : 8px ; opacity : 0 ; -webkit-transform : translate( 0px , -20px) ; -webkit-transform-origin : 50% 50% ; -webkit-transition : -webkit-transform 0.2s ease-in , opacity 0.4s ease-in ;}',oLength+70);
	document.styleSheets[0].insertRule('#notifire_canvas .Notifire-popon { opacity : 1 ; -webkit-transform : translate( 0px , 0px ) ; }',oLength+71);
	document.styleSheets[0].insertRule('#notifire_canvas .Notifire-pushout {  opacity : 0 ; }',oLength+72);
	document.styleSheets[0].insertRule('.Notifire div.icon {float : left ; padding : 5px;}',oLength+73);
	document.styleSheets[0].insertRule('.Notifire img.icon { width : 30px ; height 30px }',oLength+74);
	document.styleSheets[0].insertRule('.Notifire div.description { margin-left : 40px ; padding : 5px ; width: 400px ; text-align : left 	; font-size: 12px ; color : white ;}',oLength+75);
}


if (typeof(BitlyApi) == 'undefined')
    var BitlyApi = {}; // BitlyApi namespace. You sholdn't need to access methods here. Instead, use an instance of BitlyApiClient().
 
if (typeof(BitlyCB) == 'undefined')
    var BitlyCB = {}; // global namespace for your callback methods. Allows you to define callabacks from within other method calls.
 
BitlyApi.loadScript = function(_src) { 
  var e = document.createElement('script'); 
  e.setAttribute('language','javascript'); 
  e.setAttribute('type', 'text/javascript');
  e.setAttribute('src',_src); document.body.appendChild(e); 
};
 
BitlyApi.loadCss = function(u) { 
  var e = document.createElement('link'); 
  e.setAttribute('type', 'text/css'); 
  e.setAttribute('href', u); 
  e.setAttribute('rel', 'stylesheet'); 
  e.setAttribute('media', 'screen');
  try {
    document.getElementsByTagName('head')[0].appendChild(e);
  } catch(z) {
    document.body.appendChild(e);
  }
};
 
BitlyApi.call = function(method, params, callback_method_name) {
    var s = "http://api.bit.ly/" + method;
    var url_args = [];
    if (callback_method_name) url_args.push("callback=" + callback_method_name);
    
    for (var name in params) {
        url_args.push(name + "=" + encodeURIComponent(params[name]));
    };
    
    s += "?" + url_args.join("&");
    BitlyApi.loadScript(s);
};
 
var BitlyApiClient = function(login, apiKey, version){
    this.login = login || "ttrace";
    this.apiKey = apiKey || "R_2b774725405f8f66f2f6565838bb04f5";
    this.version = version || "2.0.1";
};
 
BitlyApiClient.prototype.googleVisRequired = "This method requires the google visualization api. Please include javascript from: http://www.google.com/jsapi. More info: http://code.google.com/apis/visualization/documentation/index.html";
BitlyApiClient.prototype.availableModules = ['stats'];
BitlyApiClient.prototype.loadingModules = {};
 
BitlyApiClient.prototype.moduleLoaded = function(module_name, callback_method_name) {
    BitlyApiClient.prototype.loadingModules[module_name] = true;
    for (var mod in BitlyApiClient.prototype.loadingModules) {
        if (!BitlyApiClient.prototype.loadingModules[mod]) {
            return false;
        }
    };
    eval(callback_method_name + "();");
};
 
BitlyApiClient.prototype.loadModules = function(module_names, callback_method_name) {
    for (var i=0; i < module_names.length; i++) {
        BitlyApiClient.prototype.loadingModules[module_names[i]] = false;
    };
    for (var i=0; i < module_names.length; i++) {
        var name = module_names[i];
        var callback_name = "module_" + name + "_loaded";
        BitlyCB[callback_name] = function() {
          BitlyApiClient.prototype.moduleLoaded(name, callback_method_name);
        };
        var s = "http://bit.ly/app/modules/" + name + ".js?callback=BitlyCB." + callback_name;
        try {
            BitlyApi.loadScript(s);
        } catch(e) {
            BitlyClient.addPageLoadEvent(function(){
                BitlyApi.loadScript(s);
            });
        }
    };
    try {
        BitlyApi.loadCss("http://bit.ly/static/css/javascript-modules.css");
    } catch(e) {
        BitlyClient.addPageLoadEvent(function(){ 
            BitlyApi.loadCss("http://bit.ly/static/css/javascript-modules.css"); 
        });
    }
};


// following code is for bit.ly supporting.
/*
# utils
 
*/
BitlyApiClient.prototype.addPageLoadEvent = function(func) {
	var oldonload = window.onload;
	if (typeof window.onload != 'function') {
		window.onload = func;
	} else {
		window.onload = function() { oldonload(); func(); };
	}
};
 
BitlyApiClient.prototype.extractBitlyHash = function(bitly_url_or_hash) {
    if (bitly_url_or_hash == null) {
        return null;
    } else {
        var m = bitly_url_or_hash.match(/\/([^\/]+)$/);
        if (m) {
            return m[1];
        }
        else {
            return bitly_url_or_hash;
        }
    }
};
 
BitlyApiClient.prototype.createElement = function(element_type, attrs) {
  var el = document.createElement(element_type);
  for (var k in attrs) {
    if (k == "text") {
      el.appendChild(document.createTextNode(attrs[k]));
    } else {
      this.setAttribute(el, k, attrs[k]);
    }
  };
  return el;
};
 
BitlyApiClient.prototype.setAttribute = function(element, attribute_name, attribute_value) {
  if (attribute_name == "class") {
    element.setAttribute("className", attribute_value); // set both "class" and "className"
  }
  return element.setAttribute(attribute_name, attribute_value);
};
 
BitlyApiClient.prototype.listen = function (elem, evnt, func) {
  if (elem.addEventListener) // W3C DOM
    elem.addEventListener(evnt,func,false);
  else if (elem.attachEvent) { // IE DOM
    var r = elem.attachEvent("on"+evnt, func);
    return r;
  }
};
 
BitlyApiClient.prototype.targ = function (e) {
	var targ;
	if (!e) var e = window.event;
	if (e.target) targ = e.target;
	else if (e.srcElement) targ = e.srcElement;
	if (targ.nodeType == 3) // defeat Safari bug
		targ = targ.parentNode;
	return targ;
};
 
BitlyApiClient.prototype.toggle = function(el) {
  var e;
  if (typeof(el) == 'string') {
    e = document.getElementById(el);
    if (typeof(e) == undefined) {
      throw "toggle: No DOM element with id: " + el;
      return;
    }
  } else {
    e = el;
  }
  if (e.style.display == 'none') {
    e.style.display = '';
  } else {
    e.style.display = 'none';
  }
};
 
/*
# API
    
Generic API caller for more advanced API usage. Allows you to specify extra params for method calls with options. Eg, you can call the /info API and ask for a subset of data using the 'keys' param.
*/
BitlyApiClient.prototype.call = function(method, params, callback_method_name) {
    params['version'] = this.version;
    params['login'] = this.login;
    params['apiKey'] = this.apiKey;
    return BitlyApi.call(method, params, callback_method_name);
};
 
// shorten a long url
BitlyApiClient.prototype.shorten = function(longUrl, callback_method_name) {
    return this.call('shorten', {'longUrl': longUrl}, callback_method_name);
};
 
// expand a bitly url
BitlyApiClient.prototype.expand = function(shortUrl, callback_method_name) {
    return this.call('expand', {'shortUrl': shortUrl}, callback_method_name);
};

 
// get info about one or more bitly urls or hashes
BitlyApiClient.prototype.info = function(bitly_hash, callback_method_name) {
    var arr = bitly_hash.split(',');
    var hashes = [];
    for (var i=0; i < arr.length && i < 1; i++) {// limit to 1 bitly_hash
        hashes.push(this.extractBitlyHash(arr[i]));
    };
    return this.call('info', {'hash': hashes.join(',')}, callback_method_name);
};
 
// get referrer data about a bilty url or hash
BitlyApiClient.prototype.stats = function(bitly_hash_or_url, callback_method_name) {
    bitly_hash_or_url = this.extractBitlyHash(bitly_hash_or_url);
    return this.call('stats', {'hash': bitly_hash_or_url}, callback_method_name);
};
 
/*
# TESTS
    
*/
BitlyApiClient.prototype.shortenTest = function() {
    this.shorten(document.location, 'shortenTestCB');
};
function shortenTestCB(data) {
    // this is how to get a result of shortening a single url
    var result;
    for (var r in data.results) {
        result = data.results[r];
        result['longUrl'] = r;
        break;
    };
    alert(result['longUrl'] + " shortened to " + result['shortUrl']);
};
 
BitlyApiClient.prototype.expandTest = function() {
    this.expand("http://bit.ly/3j4ir4", 'expandTestCB');
};
function expandTestCB(data) {
    // this is how to get a result of expanding a single url
    var result;
    for (var r in data.results) {
        result = data.results[r];
        result['hash'] = r;
        break;
    };
    alert(result['hash'] + " expanded to " + result['longUrl']);
};
 
BitlyApiClient.prototype.infoTest = function() {
    this.info("http://bit.ly/3j4ir4", 'infoTestCB');
};
function infoTestCB(data) {
    // this is how to get a doc of info call for a single url
    var doc;
    for (var r in data.results) {
        doc = data.results[r];
        break;
    };
    alert("got info for " + doc['hash'] + ". eg., longUrl is " + doc['longUrl'] + ", title is " + doc['htmlTitle']);
};
 
BitlyApiClient.prototype.statsTest = function() {
    this.stats("http://bit.ly/3j4ir4", 'statsTestCB');
};
function statsTestCB(data) {
    var stats = data.results;
    alert("stats for " + stats['hash'] + ". " + stats['clicks'] + " clicks");
};

/*
# INSTANTIATE CLIENT
    
*/
var BitlyClient = new BitlyApiClient();

/*
*/
})();

place_picture = function(id,pic_thumb_src,snip_code){
	if(pic_thumb_src.match(/^http.+/))
	{
		if(pic_thumb_src.match(/^http:\/\/s3\.amazonaws.com.+photo\-feed\.jpg$/)){
				var pic_thumb = document.createElement('img');
				var pic_thumb_link = document.createElement('a');
				pic_thumb_link.setAttribute("href", "http://bkite.com/" + snip_code);
				pic_thumb_link.setAttribute("target", "_blank");
				var pic_thumb_id = guid();
				pic_thumb_link.setAttribute("id",pic_thumb_id);
				pic_thumb.setAttribute("class","twitpic_thumb");
				pic_thumb.setAttribute("src", pic_thumb_src);
				pic_thumb_link.appendChild(pic_thumb);
				document.getElementById(id).appendChild(pic_thumb_link);
		} else {
				var pic_thumb = document.createElement('img');
				var pic_thumb_link = document.createElement('a');
				pic_thumb_link.setAttribute("href", snip_code);
				pic_thumb_link.setAttribute("target", "_blank");
				var pic_thumb_id = guid();
				pic_thumb_link.setAttribute("id",pic_thumb_id);
				pic_thumb.setAttribute("class","twitpic_thumb");
				pic_thumb.setAttribute("src", pic_thumb_src);
				pic_thumb_link.appendChild(pic_thumb);
				document.getElementById(id).appendChild(pic_thumb_link);	
		}
	}
}

expand_url = function(real_url, id){
	if(real_url.match(/^https*\:\/\/.+/))
	{
		var target = document.getElementById(id);
		target.removeEventListener("mouseover", function(e){if(e.target.tagName == 'A'){pb_snip_expander(e.target)}},"false");
		document.getElementById(id).innerText = real_url;
		var real_url_link = document.createElement('a');
		real_url_link.href = real_url.replace(/\, /g , ',');
		real_url_link.innerText = real_url.replace(/\, /g , ',');
		real_url_link.innerHTML = real_url_link.innerHTML.replace(/([\/\-?\=\+\%])/g , '$1&shy;');
		real_url_link.target = '_blank';
		target.innerText = '';
		target.appendChild(real_url_link);
		addClass(real_url_link, 'pb-real-url');
		removeClass(target,'loading');
	}
	else
	{
		var target = document.getElementById(id);
		target.removeEventListener("mouseover", function(e){if(e.target.tagName == 'A'){pb_snip_expander(e.target)}},"false");
		document.getElementById(id).innerText = 'can\'t read real url';
		removeClass(target,'loading');
	}
}

expandResponse = function(data , target_id)
{	//bit.ly expander support script
	var result;
	var url_list;
	var real_url = '';
	var i = 0;
	for( key in data.results )
	{	
		if( key.match(/\-/) )
		{
			target_id = key + '';
		} else {
			real_url = data.results[key]['longUrl'];
		}
	}
	expand_url( real_url , target_id );
	return;
}

bitly_shorten_URL = function(data)
{	//bit.ly shorten support script
	var result;
	var url_list;
	var short_url = '';
	var original_url = '';
	var i = 0;
	for( key in data.results )
	{	
		if( !key.match(/https?:\/\//) )
		{
			 original_url = key;
			 short_url = key;
		} else {
			original_url = key.replace(/(\#|\!|\?|\+|\=|\&|\%|\@|\!|\-|\/)/g,'\\$1');
			short_url = data.results[key]['shortUrl'];
			var original_text = document.getElementById('status').value;
			var replace_text = original_text.replace( new RegExp(original_url) , short_url)
			document.getElementById('status').value = replace_text;
		}
	}
	//alert(original_url + ' > ' + short_url);
	return;
}


gTransExp = function(){
	var target_id = arguments[0].replace(/__/g,'-');
	if(arguments[3] != null)
	{ //error
		var target_object = document.getElementById(target_id).getElementsByClassName('entry-content')[0];
		var translated_object = document.getElementById(target_id).getElementsByClassName('pb-translated')[0];
		translated_object.innerHTML = "" + arguments[3];
		removeClass(translated_object,'translate-loading');
	} else {
		var context = arguments[1].translatedText;
		var org_lang = arguments[1].detectedSourceLanguage;
			if(org_lang == pb_lang)
			{	//same
				var target_object = document.getElementById(target_id).getElementsByClassName('entry-content')[0];
				var translated_object = document.getElementById(target_id).getElementsByClassName('pb-translated')[0];
				target_object.parentNode.removeChild(translated_object);
			}
			else 
			{	// normal
				var target_object = document.getElementById(target_id).getElementsByClassName('entry-content')[0];
				var translated_object = document.getElementById(target_id).getElementsByClassName('pb-translated')[0];
				translated_object.innerHTML = "" + context + " -- from :" + org_lang;
				removeClass(translated_object,'translate-loading');
			}
	}
}

S4 = function() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

guid = function() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

//Standard function
hasClass = function(ele,cls) {
	try
	{
		return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
	}
	catch(err)
	{
		return false;
	}
}

addClass = function(ele,cls) {
	if (!hasClass(ele,cls)) ele.className += " "+cls;
}

removeClass = function(ele,cls) {
	if (hasClass(ele,cls)) {
		var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,'');
	}
}
