$(document).ready( function()
{

	/*
	 *   NAVIGATION
	 */

	var menuBtn = function(elem) {
		var $menu = $(elem);
		var _isOn = false;

		this.isOn = function() { return _isOn; }

		this.on = function() {
			$menu.addClass('hamburger--open');
			$menu.attr('aria-label', 'Close Menu');
			$menu.attr('aria-expanded', 'true');
			$('.modal').addClass('modal--visible');
			_isOn = true;
		}

		this.off = function() {
			$menu.removeClass('hamburger--open');
			$menu.attr('aria-label', 'Open Menu');
			$menu.attr('aria-expanded', 'false');
			$('.modal').removeClass('modal--visible');
			_isOn = false;
		}

		this.toggle = function() {
			if(this.isOn()) 
				this.off();
			else 
				this.on();
		}
	}

	var homeBtn = function(elem) {
		var $home = $(elem);

		this.on = function() {
			$home.addClass('m-logo--in_header');
			$home.attr('tabindex', '0');
		}

		this.off = function() {
			$home.removeClass('m-logo--in_header');
			$home.attr('tabindex', '-1');
		}
	}

	var menu = new menuBtn('#js-hamburger');
	var home = new homeBtn('#js-home-btn');

	$('#js-hamburger').on('click', function(e) {
		menu.toggle();
		
		if( photoGallery.isActive() ) {
			photoGallery.toggleVisibility();
		} else {
			if( menu.isOn() ) {
				home.on();
				bgvid.pause();
			}
			else {
				home.off();
				bgvid.play();
			}
		}
	});
	
	$('.js-menu-item').on('click', function(e) {
		e.preventDefault();

		menu.off();

		var cat = $(this).attr('data-menu-cat');
		photoGallery.render(cat);
		
		$('#js-bgvid-container').addClass('hidden');
		$('#js-cat-title').text( $(this).text() );
	});
	
	$('#js-home-btn').click(function(e)  {
		e.preventDefault();

		menu.off();
		home.off();
		photoGallery.setInactive();

		$('#js-bgvid-container').removeClass('hidden');

		$('#js-photo-lightbox').fadeOut(200);
		bgvid.play();
	});


	/*
	 *   FOCUSED ELEMENT HIGHLIGH
	 */

	function setFocusOutline(list) {
		$(list).on('keyup', function (e) {
			if ((e.keyCode || e.which) == 9) $(this).addClass('has-tab-focus');
		});

		$(list).on('blur', function() {
			$(this).removeClass('has-tab-focus');
		});
	}

	setFocusOutline('#js-hamburger, #js-home-btn, .js-menu-item, #js-photo-lightbox');


	/*
	 *   GALLERY
	 */

	var galleryDataModel = function() {

		var paths = {
			'sm' : 'images/small/',
			'md' : 'images/medium/',
			'lg' : 'images/large/' 
		};
		var photos = {};

		this.getPath = function(type) {
			return paths[type];
		}
		this.getCats = function() {
			return Object.keys(photos);
		}
		this.getPhotos = function(cat) {
			return photos[cat];
		}
		this.setPhotos = function(data) {
			photos = data;
		}
	}

	var photoCardView = {
		// Could be replaced with a mustache template some day
		buildHTML: function(card) {
			return '' +
			'<div class="photo-box hidden">' + 
				'<div class="photo-box__inner">' + 
					(!card.title ? '<div class="photo-box-highlight"></div>' : '') +
					'<a class="photo-link js-photo-link" href="' + galleryModel.getPath('lg') + card.filename + '">' + 
						'<img src="' + galleryModel.getPath('sm') + card.filename + '" alt="' + card.title + '">' +
					'</a>' + 
					(card.location ? '<a class="map-location js-map-location" target="_blank" title="location" href="' + card.location + '"></a>' : '') +
				'</div>' + 
				(card.title ? '<h2 class="photo-title">' + card.title + '</h2>' : '') +
			'</div>';
		}
	}

	var photoGalleryView = function(container) {

		var _cardDOMrefs = {};
		var $container = $(container);

		galleryModel.getCats().forEach( function(cat) {
			_cardDOMrefs[cat] = [];
		});

		function catExists(cat) {
			return _cardDOMrefs.hasOwnProperty(cat);
		}

		function catLoaded(cat) {
			return (catExists(cat) && _cardDOMrefs[cat].length > 0);
		}

		var $_cur_card;

		function initCards(cat) {		
			galleryModel.getPhotos(cat).forEach( function(card) {

				var $cardDOMref = $( photoCardView.buildHTML(card) );
				
				$cardDOMref.on('click', function(e) {
					e.preventDefault();
					lightbox.show(card);
					$_cur_card = $(this).find('.js-photo-link');
				});

				var highlightEl = card.title ? $cardDOMref.find('h2') : $cardDOMref.find('.photo-box-highlight');
				var color = card.color;

				$cardDOMref.find('.js-photo-link').on('focus', function(e) {
					highlightEl.css('background-color', color);
				});

				$cardDOMref.find('.js-photo-link').on('blur', function(e) {
					highlightEl.css('background-color', '');
				});

				$cardDOMref.on('mouseenter', function(e) {
					highlightEl.css('background-color', color);
				});

				$cardDOMref.on('mouseleave', function(e) {
					highlightEl.css('background-color', '');
				});

				$cardDOMref.find('.js-map-location').on('click', function(e){
					e.stopPropagation();
				});

				_cardDOMrefs[cat].push($cardDOMref);
			});

			 $container.append(_cardDOMrefs[cat]);
			 setFocusOutline('.js-map-location');
		}

		var _gallery_active;
		var _prevCat;

		this.render = function(newCat) {

			if(_prevCat && _prevCat !== newCat) {
				_cardDOMrefs[_prevCat].forEach( function(card) {
					card.addClass('hidden');
				});
			}

			if( !catExists(newCat) ) return;

			if( !catLoaded(newCat) ) initCards(newCat);

			_cardDOMrefs[newCat].forEach( function(card) {
				card.removeClass('hidden');
			});

			_prevCat = newCat;
			_gallery_active = true;

			$_cur_card = $('.photo-box:not(.hidden):first .js-photo-link');

			this.show();
		}

		this.isActive = function() {
			return _gallery_active;
		}

		this.setInactive = function() {
			_gallery_active = false;
			this.hide();
		}

		var _cur_scroll;

		this.isVisible = function() {
			return !$container.hasClass('hidden');
		}

		this.show = function() {
			$container.removeClass('hidden');
			$(document).scrollTop(_cur_scroll);
			$_cur_card.focus();
		}

		this.hide = function() {
			_cur_scroll = $(document).scrollTop();
			$container.addClass('hidden');
		}

		this.toggleVisibility = function() {
			if(this.isVisible())
				this.hide();
			else
				this.show();
		}
	}

	// LIGHTBOX COMPONENT

	var photoLightbox = function(el, elA11yHide) {

		var $container = $(el);
		var $image = $('<img src="">').appendTo($container);

		var highDPR = window.devicePixelRatio ? window.devicePixelRatio >= 1.5 ? 1 : 0 : 0;

		// To be replaced with srcset once object-fit works in Edge
		function generate_resp_path() {
			var ww = window.innerWidth;
			var wh = window.innerHeight;

			if(ww <= 660 && wh <= 660) {
				return highDPR ? galleryModel.getPath('md') : galleryModel.getPath('sm');
			}
			else if (ww <= 1200 && wh <= 1200) {
				return highDPR ? galleryModel.getPath('lg') : galleryModel.getPath('md');
			}
			else return galleryModel.getPath('lg');
		}

		this.show = function(card) {
			$image.attr('src', generate_resp_path() + card.filename);
			$image.attr('alt', card.title ? card.title : 'photograph');
			$container.fadeIn(200);
			$container.focus();

			photoGallery.hide();
			$(elA11yHide).attr('aria-hidden', true);
			
			if(history.state===null || history.state.cur_page!="photo") { 
				history.pushState({cur_page: "photo"}, null, null);
			}
		}

		this.hide = function() {
			$container.fadeOut(200, function(){
				$image.attr('src', '');
				$image.attr('alt', '');
			});

			photoGallery.show();
			$(elA11yHide).removeAttr('aria-hidden');
		}

		var that = this;

		$container.on('click', function(e) {
			that.hide();
		});

		$container.on('keydown', function(e) {
			if (e.keyCode == 27 || e.keyCode == 13) that.hide();

			// Trap the tab key on the focused modal
			if (e.keyCode == 9) e.preventDefault();
		});
		
		window.addEventListener("popstate", function(event) {
			that.hide();
		});
	}


	/*
	 *   INIT
	 */

	$('#js-bgvid').hide();

	setTimeout( function() { 
		$('#js-bgvid').fadeIn(300);
	}, 0);

	var bgvid = document.getElementById('js-bgvid');
	bgvid.play();

	var galleryModel = new galleryDataModel();
	var lightbox = new photoLightbox('#js-photo-lightbox', '#js-nav, #js-main');
	var photoGallery;

	$.getJSON("js/photo-data.json", function(data) {
		galleryModel.setPhotos(data);
		photoGallery = new photoGalleryView('#js-photo-section');
	});
	
});
