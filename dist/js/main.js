$(document).ready( function()
{
	'use strict';

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
				$('#js-bgvid-playbtn').addClass('hidden'); // CREATE VIDEO BTN COMPONENT
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
		$('#js-cat-title').focus();
	});
	
	$('#js-home-btn').click(function(e) {
		e.preventDefault();

		menu.off();
		home.off();
		photoGallery.setInactive();

		$('#js-bgvid-container').removeClass('hidden');

		$('#js-photo-lightbox').fadeOut(200);
		bgvid.play();
	});

	$('#js-bgvid-playbtn').on('click', function() {
		bgvid.play();
	});

	$('#js-bgvid').on('play', function() {
		$('#js-bgvid-playbtn').addClass('hidden');
	});


	/*
	 *   FOCUSED ELEMENT HIGHLIGH
	 */

	function setFocusOutline(list) {
		var items = list instanceof jQuery ? list : $(list);

		items.on('keyup', function (e) {
			if ((e.keyCode || e.which) == 9) $(this).addClass('has-tab-focus');
		});

		items.on('blur', function() {
			$(this).removeClass('has-tab-focus');
		});
	}

	setFocusOutline('#js-hamburger, #js-home-btn, .js-menu-item, #js-photo-lightbox, #js-bgvid-playbtn');


	/*
	 *   GALLERY
	 */

	var galleryModel = function() {
		var paths = {
			'sm' : 'images/small/',
			'md' : 'images/medium/',
			'lg' : 'images/large/' 
		};
		var photos;

		var _galleryDataAccessObj = {
			getPath : function(type) {
				return paths[type];
			},
			getCats : function() {
				return Object.keys(photos);
			},
			getPhotos : function(cat) {
				return photos[cat];
			},
			ready : function() {
				return (photos !== undefined);
			}
		};

		$.getJSON("js/photo-data.json", function(data) {
			photos = data;
		});

		return _galleryDataAccessObj;
	}();

	var photoCardView = function(gallery) {
		return {
			// Could be replaced with a mustache template some day
			buildHTML : function(card) {
				return '' +
				'<div class="photo-card hidden">' + 
					'<div class="photo-card__inner">' + 
						(!card.title ? '<div class="photo-card--highlighted"></div>' : '') +
						'<a class="photo-card__link" href="' + gallery.getPath('lg') + card.filename + '">' + 
							'<img src="' + gallery.getPath('sm') + card.filename + '" alt="' + card.title + '">' +
						'</a>' + 
						(card.location ? '<a class="photo-card__location" target="_blank" title="location" href="' + card.location + '"></a>' : '') +
					'</div>' + 
					(card.title ? '<h2 class="photo-card__title">' + card.title + '</h2>' : '') +
				'</div>';
			}
		}
	}(galleryModel);

	var photoGalleryView = function(gallery) {

		return function(container) {

			var _cardDOMrefs = {};
			var $container = $(container);

			function catExists(cat) {
				return _cardDOMrefs.hasOwnProperty(cat);
			}

			function catLoaded(cat) {
				return (catExists(cat) && _cardDOMrefs[cat].length > 0);
			}

			var $_cur_card;

			function initCards(cat) {
				_cardDOMrefs[cat] = [];

				gallery.getPhotos(cat).forEach( function(card) {

					var $cardDOMref = $( photoCardView.buildHTML(card) );

					var $highlightEl = card.title ? $cardDOMref.find('.photo-card__title') : $cardDOMref.find('.photo-card--highlighted');
					var $photo_link = $cardDOMref.find('.photo-card__link')
					var $location_icon = $cardDOMref.find('.photo-card__location');
					
					$cardDOMref.on('click', function(e) {
						e.preventDefault();
						lightbox.show(card);
						$_cur_card = $photo_link;
					});

					$photo_link.on('focus', function(e) {
						$highlightEl.css('background-color', card.color);
					});

					$photo_link.on('blur', function(e) {
						$highlightEl.css('background-color', '');
					});

					$cardDOMref.on('mouseenter', function(e) {
						$highlightEl.css('background-color', card.color);
					});

					$cardDOMref.on('mouseleave', function(e) {
						$highlightEl.css('background-color', '');
					});

					$location_icon.on('click', function(e){
						e.stopPropagation();
					});
					
					_cardDOMrefs[cat].push($cardDOMref);
					setFocusOutline($location_icon);
				});

				$container.append(_cardDOMrefs[cat]);
			}

			var _gallery_active;
			var _prevCat;

			this.render = function(newCat) {
				if( !gallery.ready() ) return;

				if(_prevCat !== newCat) {
					if(_prevCat) {
						_cardDOMrefs[_prevCat].forEach( function(card) {
							card.addClass('hidden');
						});
					}

					if( !catLoaded(newCat) ) initCards(newCat);

					_cardDOMrefs[newCat].forEach( function(card) {
						card.removeClass('hidden');
					});

					_prevCat = newCat;
				} 
				else {
					$_cur_card = undefined;
				}

				_gallery_active = true;
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
				if($_cur_card) $_cur_card.focus();
			}

			this.hide = function() {
				_cur_scroll = $(document).scrollTop();
				$container.addClass('hidden');
			}

			this.toggleVisibility = function() {
				if(this.isVisible())
					this.hide();
				else
					this.render(_prevCat); // Using render here (instead of show) to prevent scroll jump to previously focused cards
			}
		}
	}(galleryModel);

	// LIGHTBOX COMPONENT

	var photoLightbox = function(gallery) {

		return function(el, elA11yHide) {

			var $container = $(el);
			var $image = $('<img src="">').appendTo($container);

			var highDPR = window.devicePixelRatio ? window.devicePixelRatio >= 1.5 ? 1 : 0 : 0;

			// To be replaced with srcset once object-fit works in Edge
			function generate_resp_path() {
				var ww = window.innerWidth;
				var wh = window.innerHeight;

				if(ww <= 660 && wh <= 660) {
					return highDPR ? gallery.getPath('md') : gallery.getPath('sm');
				}
				else if (ww <= 1200 && wh <= 1200) {
					return highDPR ? gallery.getPath('lg') : gallery.getPath('md');
				}
				else return gallery.getPath('lg');
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
	}(galleryModel);


	/*
	 *   INIT
	 */

	var lightbox = new photoLightbox('#js-photo-lightbox', '#js-nav, #js-main');
	var photoGallery = new photoGalleryView('#js-photo-section');

	var bgvid = document.getElementById('js-bgvid');
	$(bgvid).fadeIn(800);
	
	bgvid.play()
	.catch( function(err) { 
		if(err.name === 'NotAllowedError') {
			$('#js-bgvid-playbtn').removeClass('hidden');
		}
	});
	
});
