/**
 * jQuery Gallery Box version for jQuery 1.8+, support IE8+
 *
 * @author DaVee8k
 * @version 0.30.0
 * @license https://unlicense.org/
 */
(function ($) {
	$.fn.galleryBox = function (option) {
		var self = this;
		// localization
		var clientLang = (navigator.userLanguage || navigator.language).substr(0,2).toLowerCase();
		this.text = {
			'en' : {prev: 'previous', next: 'next', close: 'close', zoom: 'detail', loading: 'loading ...', error: 'Image not found.'},
			'cs' : {prev: 'předchozí', next: 'další', close: 'zavřít', zoom: 'zvětšit', loading: 'načítá se ...', error: 'Obrázek nelze načíst.'}
		};
		this.locale = this.text[clientLang] === undefined ? this.text['en'] : this.text[clientLang];
		this.icons = option['icons'] === undefined ? {prev: '&lt;', next: '&gt;', close: '&times;'} : option['icons'];
		this.plugin = option['plugin'] === undefined ? false : option['plugin'];
		// variables
		this.box = null;
		this.modal = option['modal'] === undefined ? true : option['modal'];
		this.mark = option['mark'] === undefined ? null : option['mark'];
		this.item = option['item'] === undefined ? 'a' : option['item'];
		this.arrows = option['arrows'] === undefined ? true : option['arrows'];
		this.pager = option['pager'] === undefined ? false : option['pager'];
		this.duration = option['duration'] === undefined ? 250 : option['duration'];
		this.swipe = option['swipe'] !== false && this.arrows;
		this.shrink = option['shrink'] === undefined ? true : option['shrink'];
		this.iframe = option['iframe'] === undefined ? null : option['iframe'];

		this.current = -1;
		this.count = 0;
		this.data = Array();
		this.touches = Array();

		// load links from element
		this.load = function (element) {
			var images = $(element).find(this.item);
			if (images.length !== 0) {
				$(images).each( function () { self.loadImage(this);	});
			}
			else self.loadImage(element);
			return this.count > 0;
		};

		// add image
		this.loadImage = function (link) {
			if ($(link).attr('href') !== undefined) {
				var title = null;
				if ($(link).data('title') !== undefined) title = $(link).data('title');
				else if ($(link).attr('title') !== undefined) title = $(link).prop('title');
				else title = $(link).children('img').prop('title');

				this.data.push({'src': $(link).attr('href'), 'title': title, 'link': link});
				var x = this.count + 0;
				$(link).click( function (e) {
					e.preventDefault();
					self.showNum(x);
				});
				this.count++;
			}
		};

		this.insertImage = function (src, title, link) {
			this.data.push({'src': src, 'title': title, 'link': link});
			this.count++;
		};

		// create link on element to show gallery
		this.createLink = function (element) {
			var img = $('#' + element + ' img').attr('src');
			img = img.substring(img.lastIndexOf('/') + 1);
			for (var i = 0; i < this.data.length; i++) {
				if (this.data[i]['src'].indexOf(img) > 0) {
					$('#'+element).click( function (e) {
						e.preventDefault();
						self.showNum(i);
					});
					$('#'+element).css('cursor','pointer');
					break;
				}
			}
		};

		/**
		 * Scale element (image of iframe) to fit display view
		 * @param {Element} img
		 * @param {Boolean} itemLoad
		 * @returns {Boolean}
		 */
		this.scaleImage = function (img, itemLoad) {
			var gBox = $(this.box).find('.gallery-box');
			if (itemLoad) $(this.box).append(img);

			var height = $(img).attr('height') || $(img).prop('height') || $(img).outerHeight(true);
			if (height === 0) height = null;
			var orgHeight = height;
			var width = $(img).attr('width') || $(img).prop('width') || $(img).outerWidth(true);
			if (width === 0) width = null;
			var orgWidth = width;
			if (itemLoad) $(img).detach();

			var winHeight = $(window).height() - $(gBox).outerHeight(true) + $(gBox).find('.gallery-box-image').outerHeight(true);
			var winWidth = $(gBox).width() - $(gBox).find('.gallery-box-content').outerWidth(true) + $(gBox).find('.gallery-box-image').outerWidth(true);
			if ($(gBox)[0].getBoundingClientRect().width !== $(gBox).width()) winWidth -= 1;	// fix hidpi float

			if (this.shrink) {
				if (height > winHeight) {
					width = width * winHeight / height;
					height = winHeight;
				}
				if (width > winWidth) {
					height = height * winWidth / width;
					width = winWidth;
				}
			}
			return [width, height, this.shrink && (orgHeight != height  || orgWidth != width)];
		};

		/**
		 * Move to neighbor image
		 * @param {Boolean} left
		 */
		this.showNext = function (left) {
			if (left) {
				if (this.current > 0) this.showNum(this.current - 1);
			}
			else {
				if (this.current < this.count-1) this.showNum(this.current + 1);
			}
		};

		/**
		 * Show content
		 * @param {Integer} num
		 */
		this.showNum = function (num) {
			// activate box on first request
			if (this.box === null) {
				this.create();
				this.appendAction();
			}

			var imgNew = new Image();
			var imgBox = $(this.box).find('.gallery-box-image');
			var oldContent = $(imgBox).children('img');
			if (oldContent.length === 0) oldContent = $(imgBox).children('iframe');

			// content is already loaded
			$(this.box).addClass('gallery-box-loading');
			if ($(this.box).css('display') === 'none') {
				$(oldContent).toggle(this.current === num);
				$(this.box).fadeIn(500);
				$(this.box).find('.gallery-box').css('top', this.center());
				if (this.current === num) {
					this.showItem(oldContent, imgBox.height(), num, false);
				}
			}

			// image is different
			this.current = num;
			$(this.box).find('.gallery-box-zoom').hide();
			this.setInfo(self.locale['loading']);

			$(oldContent).fadeOut(200, function () {
				if (self.plugin) self.plugin.showNum(num);
				$(this).remove();

				if (self.isFrame(self.current)) {
					var iframe = $('<iframe src="' + self.data[num]['src'] + '" class="gallery-box-iframe" referrerpolicy="origin-when-cross-origin" allowfullscreen="">');
					self.showItem(iframe, $(imgBox).height() || $(oldContent).height(), num, true);
				}
				else {
					$(imgNew).on("load", function () {
						self.showItem(this, $(imgBox).height() || $(oldContent).height(), num, false);
					}).on("error", function () {
						$(imgNew).stop(true,true);
						$(imgBox).append(new Image());
						self.setInfo(self.locale['error'], num);
					}).hide().attr('src', self.data[self.current]['src']);
				}
			});

			if (this.arrows) {
				$(this.box).find('.gallery-box-left').toggle(this.current !== 0);
				$(this.box).find('.gallery-box-right').toggle(this.current < this.count-1);
			}
		};

		/**
		 * Show new image
		 * @param {Image} item
		 * @param {Integer} oldHeight
		 * @param {Integer} num
		 */
		this.showItem = function (item, oldHeight, num, itemLoad) {
			var reScale = this.scaleImage(item, itemLoad);
			$(this.box).find('.gallery-box').animate({ top: this.center( $(this.box).find('.gallery-box').outerHeight(true) - oldHeight + (reScale[1] ? parseFloat(reScale[1]) : 0) ) }, this.duration);
			$(this.box).find('.gallery-box-content').animate({ width: reScale[0] + 'px' }, this.duration);
			$(this.box).find('.gallery-box-image').append(item).animate({ width: reScale[0] + 'px', height: reScale[1] + 'px' }, this.duration, function () {
				$(self.box).find('.gallery-box-image').children().fadeIn(200, function () {
					if ($(item).attr('src') !== undefined) $(self.box).removeClass('gallery-box-loading');
					if (reScale[2]) $(self.box).find('.gallery-box-zoom').prop('href', self.data[self.current]['src']).fadeIn(200);
				});
			});
			this.setInfo(this.data[num]['title'], num);
		};

		this.isFrame = function (num) {
			return this.iframe !== false && this.data[num]['link'] !== null && $(this.data[num]['link']).hasClass(this.iframe);
		};

		this.setInfo = function (title, num) {
			$(this.box).find('.gallery-box-title').html(title);
			if (this.pager && num !== undefined) $(this.box).find('.gallery-box-num-current').text(num + 1);
		};

		/**
		 * Center image preview
		 * @param {Integer} newHeight
		 * @returns {String}
		 */
		this.center = function (newHeight) {
			if ($(this.box).find('.gallery-box-all').width() < $(document).width()) $(this.box).find('.gallery-box-all').width($(document).width());
			var top = $(window).scrollTop() + Math.round(($(window).height() - (newHeight === undefined ? $(this.box).find('.gallery-box').outerHeight(true) : newHeight)) / 2);
			return  top > 0 ? top + 'px' : 0;
		};

		/**
		 * Append action to arrows keys, swipe and close button
		 */
		this.appendAction = function () {
			var self = this;

			$(document).keydown( function (e) {
				if ($(self.box).is(':visible')) {
					if (self.arrows && e.keyCode == 37) { e.preventDefault(); self.showNext(true); }
					else if (self.arrows && e.keyCode == 39) { e.preventDefault(); self.showNext(false); }
					else if (e.keyCode == 27) { e.preventDefault(); $(self.box).fadeOut(500); }
				}
			});

			$(this.box).find('.gallery-box-close').click(function (e) {
				e.preventDefault();
				$(self.box).fadeOut(500);
			});
			$(this.box).find('.gallery-box-modal').click(function () {
				$(self.box).fadeOut(500);
			});

			if (this.arrows) {
				$(this.box).find('.gallery-box-left').click(function (e) {
					e.preventDefault();
					self.showNext(true);
				});
				$(this.box).find('.gallery-box-right').click(function (e) {
					e.preventDefault();
					self.showNext(false);
				});
			}

			if (this.swipe === true) {
				$(this.box).on("touchstart", function (e) {
					self.touches[0] = e.originalEvent.touches[0].clientX;
				});
				$(this.box).on("touchmove", function (e) {
					self.touches[1] = e.originalEvent.touches[0].clientX;
				});
				$(this.box).on("touchend", function () {
					if (self.touches.length === 2) {
						var direction = self.touches[1] - self.touches[0];
						if (Math.abs(direction) > ($(window).width() / 10)) {
							self.showNext(direction > 0);
						}
					}
					self.touches = Array();
				});
			}
		};

		/**
		 * Create elements for gallery window
		 */
		this.create = function () {
			this.box = $('<div class="gallery-box-all"' + (this.mark ? ' id="' + this.mark + '"' : '') + '>' + (this.modal ? '<div class="gallery-box-modal"></div>' : '') + '</div>');
			$(this.box).append('<div class="gallery-box"><div class="gallery-box-content">' +
				'<div class="gallery-box-image"><div class="gallery-box-loader"></div><img /></div>' +
				'<div class="gallery-box-info">' + (this.arrows ? '<button class="gallery-box-left" title="'+this.locale["prev"]+'"><span>' + this.icons["prev"] + '</span></button>' +
				(this.pager ? '<span class="gallery-box-num-current">1</span> / <span class="gallery-box-num-count">' + this.count + '</span>' : '') +
				'<button class="gallery-box-right" title="'+this.locale["next"]+'"><span>' + this.icons["next"] + '</span></button>' : '') +
				'<button class="gallery-box-close" title="'+this.locale["close"]+'"><span>' + this.icons["close"] + '</span></button></div>' +
				(this.shrink ? '<a class="gallery-box-zoom" title="'+this.locale["zoom"]+'" target="_blank" href="#"></a>' : '') +
				'<p class="gallery-box-title"></p></div></div>');
			$("body").append(this.box);
		};

		if (this.load(this)) {
			if (option['opener'] !== undefined) {
				$(this).find(option['opener']).css('cursor','pointer').each( function () {
					$(this).click( function (e) {
						e.preventDefault();
						$(self.showNum(0));
					});
				});
			}
		};

		// public functions
		return {
			showNum: function (num) { self.showNum(num); },
			showNext: function (direction) { self.showNext(direction); }
		};
	};
}(jQuery));
