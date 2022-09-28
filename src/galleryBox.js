/**
 * jQuery Gallery Box version for jQuery 1.8+, support IE8+
 *
 * @author DaVee8k
 * @version 0.28.3
 * @license WTFNMFPL 1.0
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
		this.mark = option['mark'] === undefined ? null : option['mark'];
		this.item = option['item'] === undefined ? 'a' : option['item'];
		this.arrows = option['arrows'] === undefined ? true : option['arrows'];
		this.pager = option['pager'] === undefined ? false : option['pager'];
		this.duration = option['duration'] === undefined ? 250 : option['duration'];
		this.shrink = option['shrink'] === undefined ? true : option['shrink'];
		this.iframe = option['iframe'] === undefined ? null : option['iframe'];

		this.current = -1;
		this.count = 0;
		this.data = Array();

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
				$(link).click( function () { return self.showNum(x); });
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
					$('#'+element).click( function () { return self.showNum(i); });
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
		 * @returns {Boolean}
		 */
		this.showNext = function (left) {
			if (left) {
				if (this.current > 0) this.showNum(this.current - 1);
			}
			else {
				if (this.current < this.count-1) this.showNum(this.current + 1);
			}
			return false;
		};

		/**
		 * Show content
		 * @param {Integer} num
		 * @returns {Boolean}
		 */
		this.showNum = function (num) {
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
					return false;
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
				$(this.box).find('a.gallery-box-left').toggle(this.current !== 0);
				$(this.box).find('a.gallery-box-right').toggle(this.current < this.count-1);
			}
			return false;
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
		 * Append action to arrows, keys and close button
		 */
		this.appendAction = function () {
			// action association
			$(this.box).find('a.gallery-box-left').click(function() {return self.showNext(true);});
			$(this.box).find('a.gallery-box-right').click(function() {return self.showNext(false);});
			$(document).keydown( function(e) {
				if ($(self.box).is(':visible')) {
					if (self.arrows && e.keyCode == 37) { e.preventDefault(); self.showNext(true); }
					else if (self.arrows && e.keyCode == 39) { e.preventDefault(); self.showNext(false); }
					else if (e.keyCode == 27) { e.preventDefault(); $(self.box).fadeOut(500); }
				}
			});
			$(this.box).find('a.gallery-box-close').click(function() { $(self.box).fadeOut(500); return false; });
			$(this.box).find('.gallery-box-modal').click(function() { $(self.box).fadeOut(500); });
		};

		/**
		 * Create elements for gallery window
		 * @param {Boolean} background
		 */
		this.create = function (background) {
			this.box = $('<div class="gallery-box-all"' + (this.mark ? ' id="' + this.mark + '"' : '') + '>' + (background ? '<div class="gallery-box-modal"></div>' : '') + '</div>');
			$(this.box).append('<div class="gallery-box"><div class="gallery-box-content">' +
				'<div class="gallery-box-image"><div class="gallery-box-loader"></div><img /></div>' +
				'<div class="gallery-box-info">' + (this.arrows ? '<a class="gallery-box-left" title="'+this.locale["prev"]+'"><span>' + this.icons["prev"] + '</span></a>' +
				(this.pager ? '<span class="gallery-box-num-current">1</span> / <span class="gallery-box-num-count">' + this.count + '</span>' : '') +
				'<a class="gallery-box-right" title="'+this.locale["next"]+'"><span>' + this.icons["next"] + '</span></a>' : '') +
				'<a class="gallery-box-close" title="'+this.locale["close"]+'"><span>' + this.icons["close"] + '</span></a></div>' +
				(this.shrink ? '<a class="gallery-box-zoom" title="'+this.locale["zoom"]+'" target="_blank"></a>' : '') +
				'<p class="gallery-box-title"></p></div></div>');
			$("body").append(this.box);
		};

		if (this.load(this)) {
			if (option['opener'] !== undefined) {
				$(this).find(option['opener']).css('cursor','pointer').each( function () {
					$(this).click( function () { $(self.showNum(0)); return false; })
				});
			}
			this.create(option['modal'] !== undefined ? option['modal'] : true);
			this.appendAction();
		};

		// public functions
		return {
			showNum: function (num) { self.showNum(num); },
			showNext: function (direction) { self.showNext(direction); }
		};
	};
}(jQuery));