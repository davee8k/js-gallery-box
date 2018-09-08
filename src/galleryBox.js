/**
 * GalleryBox version for jQuery 1.8+
 * @author DaVee
 * @version 0.27
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
		this.box;
		this.mark = option['mark'] === undefined ? false : option['mark'];
		this.page = option['page'] === undefined ? 'a' : option['page'];
		this.arrows = option['arrows'] === undefined ? true : option['arrows'];
		this.pager = option['pager'] === undefined ? false : option['pager'];
		this.duration = option['duration'] === undefined ? 250 : option['duration'];
		this.scale = option['scale'] === undefined ? true : option['scale'];

		this.current = -1;
		this.count = 0;
		this.srcs = Array();
		this.titles = Array();

		// load links from element
		this.load = function (element) {
			var images = $(element).find(this.page);
			if (images.length !== 0) {
				$(images).each( function () { self.loadImage(this);	});
			}
			else self.loadImage(element);
			return this.count > 0;
		};

		// add image
		this.loadImage = function (link) {
			if ($(link).attr('href') !== undefined) {
				this.srcs.push($(link).attr('href'));
				if ($(link).data("title") !== undefined) this.titles.push($(link).data("title"));
				else if ($(link).attr('title') !== undefined) this.titles.push($(link).prop('title'));
				else this.titles.push($(link).children('img').prop('title'));
				var x = this.count + 0;
				$(link).click( function () { return self.showNum(x); });
				this.count++;
			}
		};

		this.insertImage = function (src, title) {
			this.srcs.push(src);
			this.titles.push(title === undefined ? '' : title);
			this.count++;
		};

		// create link on element to show gallery
		this.createLink = function (element) {
			var img = $('#' + element + ' img').attr('src');
			img = img.substring(img.lastIndexOf('/') + 1);
			for (var i = 0; i < this.srcs.length; i++) {
				if (this.srcs[i].indexOf(img) > 0) {
					$('#' + element).click( function () { return self.showNum(i); });
					$('#' + element).css('cursor','pointer');
					break;
				}
			}
		};

		/**
		 * Scale image to fit display view
		 * @param {Image} img
		 * @returns {Boolean}
		 */
		this.scaleImage = function (img) {
			var height = $(img).attr('height') || $(img).prop('height');
			var orgHeight = height;
			var width = $(img).attr('width') || $(img).prop('width');
			var orgWidth = width;
			var winHeight = $(window).height() - $(this.box).find('.gallery-box').outerHeight(true) + $(this.box).find('.gallery-box-image').outerHeight(true);
			var winWidth = ($(this.box)[0].getBoundingClientRect().width || $(this.box).find('.gallery-box').width()) + $(this.box).find('.gallery-box').width() - $(this.box).find('.gallery-box').outerWidth(true);

			if (this.scale) {
				if (height > winHeight) {
					width = Math.floor(width * winHeight / height);
					height = winHeight;
				}
				if (width > winWidth) {
					height = Math.floor(height * winWidth / width);
					width = winWidth;
				}
			}
			return [width, height, this.scale && (orgHeight != height  || orgWidth != width)];
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
		 * Show image
		 * @param {Integer} num
		 * @returns {Boolean}
		 */
		this.showNum = function (num) {
			var imgNew = new Image();
			var imgBox = $(this.box).find('.gallery-box-image');
			var imgOld = $(imgBox).children('img');

			$(this.box).addClass('gallery-box-loading');
			if ($(this.box).css('display') === 'none') {
				$(imgOld).toggle(this.current === num);
				$(this.box).fadeIn(500);
				$(this.box).find('.gallery-box').css('top', this.center());
				if (this.current === num) {
					self.showImage(imgOld, imgBox.height(), num);
					return false;
				}
			}

			this.current = num;
			$(this.box).find('.gallery-box-zoom').hide();
			$(this.box).find('.gallery-box-title').text(self.locale['loading']);

			$(imgOld).fadeOut(200, function () {
				if (self.plugin) self.plugin.showNum(num);
				$(this).remove();

				$(imgNew).load(function () {
					$(self.box).find('.gallery-box-title').html(self.titles[self.current]);
					self.showImage(this, $(imgBox).height() || $(imgOld).height(), num + 1);
				}).error(function () {
					$(imgNew).stop(true,true);
					$(self.box).find('.gallery-box-image').append(new Image());
					$(self.box).find('.gallery-box-title').text(self.locale['error']);
					$(self.box).find('.gallery-box-position').text(num+1);
				}).hide().attr('src', self.srcs[self.current]);
			});
			if (this.arrows) {
				$(this.box).find('a.gallery-box-left').toggle(this.current !== 0);
				$(this.box).find('a.gallery-box-right').toggle(this.current < this.count-1);
			}
			return false;
		};

		/**
		 * Show new image
		 * @param {Image} img
		 * @param {Integer} oldImgHeight
		 * @param {Integer} num
		 */
		this.showImage = function (img, oldImgHeight, num) {
			var reScale = this.scaleImage(img);
			$(this.box).find('.gallery-box').animate({ top: this.center( $(this.box).find('.gallery-box').outerHeight(true) - oldImgHeight + reScale[1] ) }, this.duration);
			$(this.box).find('.gallery-box-image').append(img).animate({ width: reScale[0] + 'px', height: reScale[1] + 'px' }, this.duration, function () {
				$(self.box).find('.gallery-box-image img').fadeIn(200, function () {
					if ($(img).attr('src') !== undefined) $(self.box).removeClass('gallery-box-loading');
					if (reScale[2]) $(self.box).find('.gallery-box-zoom').prop('href', self.srcs[self.current]).fadeIn(200);
				});

				if (self.pager) $(self.box).find('.gallery-box-num-current').text(num);
			});
		};

		/**
		 * Center image preview
		 * @param {Integer} newHeight
		 * @returns {String}
		 */
		this.center = function (newHeight) {
			if ($(this.box).find('.gallery-box-all').width() < $(document).width()) $(this.box).find('.gallery-box-all').width($(document).width());
			var top = $(window).scrollTop() + Math.round(($(window).height() - (newHeight === undefined ? $(this.box).find('.gallery-box').outerHeight(true) : newHeight)) / 2);
			// position fixed - fix IE6
			if ($(this.box).find('.gallery-box-black').css('position') !== 'fixed') {
				$(this.box).find('.gallery-box-black')
					.height($(window).height() > $(document).height() ? $(window).height() : $(document).height())
					.width($(window).width() > $(document).width() ? $(window).width() : $(document).width());
				if (($(this.box).find('.gallery-box').offset().top + $(this.box).find('.gallery-box').height()) > $(this.box).find('.gallery-box-black').height()) {
					$(this.box).find('.gallery-box-black').height($(this.box).find('.gallery-box').offset().top + $(this.box).find('.gallery-box').height());
				}
				if ($(this.box).find('.gallery-box').width() > $(this.box).find('.gallery-box-black').width()) {
					$(this.box).find('.gallery-box-black').width($(this.box).find('.gallery-box').width());
				}
				$(this.box).find('.gallery-box-black').css('position','absolute');
			}
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
					if (self.arrows || self.pager) {
						if (e.keyCode == 37) { e.preventDefault(); self.showNext(true); }
						else if (e.keyCode == 39) { e.preventDefault(); self.showNext(false); }
					}
					else if (e.keyCode == 27) { e.preventDefault(); $(self.box).fadeOut(500); }
				}
			});
			$(this.box).find('a.gallery-box-close').click(function() { $(self.box).fadeOut(500); return false; });
			$(this.box).find('.gallery-box-black').click(function() { $(self.box).fadeOut(500); });
		};

		/**
		 * Create elements for gallery window
		 * @param {Boolean} background
		 */
		this.create = function (customClass, background) {
			this.box = $('<div class="gallery-box-all' + (customClass ? ' ' + customClass : '') + '"'
					+ (this.mark ? ' id="' + this.mark + '"' : '') + '>'
					+ (background ? '<div class="gallery-box-black"></div>' : '') + '</div>');
			$(this.box).append('<div class="gallery-box">' +
				'<div class="gallery-box-image"><img /></div>' +
				'<div class="gallery-box-info">' + (this.arrows ? '<a class="gallery-box-left" title="'+this.locale["prev"]+'"><span>' + this.icons["prev"] + '</span></a>' +
				(this.pager ? '<span class="gallery-box-num-current">1</span> / <span class="gallery-box-num-count">' + this.count + '</span>' : '') +
				'<a class="gallery-box-right" title="'+this.locale["next"]+'"><span>' + this.icons["next"] + '</span></a>' : '') +
				'<a class="gallery-box-close" title="'+this.locale["close"]+'"><span>' + this.icons["close"] + '</span></a></div>' +
				(this.scale ? '<a class="gallery-box-zoom" title="'+this.locale["zoom"]+'" target="_blank"></a>' : '') +
				'<p class="gallery-box-title"></p></div>');
			$("body").append(this.box);
		};

		if (this.load(this)) {
			this.create(option['class'] !== undefined ? option['class'] : '', option['background'] !== undefined ? option['background'] : true);
			this.appendAction();
		};

		// public functions
		return {
			showNum: function (num) { self.showNum(num); },
			showNext: function (direction) { self.showNext(direction); }
		};
	};
}(jQuery));
