var SelectView = Backbone.View.extend({

	initialize: function() {
		console.log("Init: SelectView");
		this.template = Handlebars.compile(tpl.get("select"));
		this.currentPair = undefined;
	},

	render: function(eventName) {
		$(this.el).html(this.template());

		this.container1 = $('<img>', {
			src: 'img/loader.gif',
			crossOrigin: ''
		}).css({
			display: 'none',
			position: 'absolute',
			left: '0px',
			top: '0px'
		});
		this.container2 = $('<img>', {
			src: 'img/loader.gif',
			crossOrigin: ''
		}).css({
			display: 'none',
			position: 'absolute',
			left: '0px',
			top: '0px'
		});
		$('body').append(this.container1).append(this.container2);

		this.testData = TestData.getInstance();
		this.next();

		return this;
	},

	_createObject: function(item) {

		if (item instanceof FacebookPicture) {

			return $('<img>', {
				src: item.get('source'),
				title: item.get('name'),
				'class': 'img-rounded'
			}).click(_.bind(function() {
				this.next(item);
			}, this));

		}
		else if (item instanceof FacebookPost) {

		}

	},

	next: function(winner) {
		if (this.currentPair !== undefined) {
			console.log('[SelectView] Last comparision\'s winner was ', winner);
			this.testData.setWinner(this.currentPair[0], this.currentPair[1], winner);
			ProgressBar.getInstance().subto(TestData.getInstance().getCurrentRound(), TestData.getInstance().getMaxRounds());
		}

		this.currentPair = this.testData.getRateTupple();

		if (this.currentPair !== undefined) {
			
			var item1 = this.currentPair[0];
			var item2 = this.currentPair[1];

			$(this.el).find(SelectView.IMAGE_1_CONTAINER + ' ' + SelectView.INFO_CONTAINER).fadeOut('fast');
			$(this.el).find(SelectView.IMAGE_2_CONTAINER + ' ' + SelectView.INFO_CONTAINER).fadeOut('fast');
			$(this.el).find(SelectView.IMAGE_1_CONTAINER).unbind('click').fadeOut('fast');
			$(this.el).find(SelectView.IMAGE_2_CONTAINER).unbind('click').fadeOut('fast', _.bind(function() {

				$(this.el).find(SelectView.IMAGE_1_CONTAINER).css('background-image', 'url(' + SelectView.LOADER_GIF_SRC + ')').fadeIn('fast');
				$(this.el).find(SelectView.IMAGE_2_CONTAINER).css('background-image', 'url(' + SelectView.LOADER_GIF_SRC + ')').fadeIn('fast');

				var dominantColor = SelectView.DEFAULT_COLOR,
					loaded = [];

				$(this.container1).attr('src', item1.get('source')).bind('load', _.bind(function(event) {

					try {
						dominantColor = getDominantColor(event.target);
					}
					catch(e) {
						console.error('[SelectView] Error getting dominant color, using default:', e);
					}

					loaded1 = true;
					$(this.container1).unbind();
					this.imagesLoadedCb(loaded.push(true), dominantColor);
				}, this));

				$(this.container2).attr('src', item2.get('source')).bind('load', _.bind(function(event) {
					loaded2 = true;
					$(this.container2).unbind();
					this.imagesLoadedCb(loaded.push(true), dominantColor);
				}, this));

			}, this));

		}
		else {
			console.log('[SelectView] Selection done');
			this.trigger('select:done');
		}
	},

	imagesLoadedCb: function(img, dominantColor) {

		if (img != 2) return;

		var item1 = this.currentPair[0];
		var item2 = this.currentPair[1];

		$(this.el).find(SelectView.IMAGE_1_CONTAINER).unbind('click').fadeOut('fast');
		$(this.el).find(SelectView.IMAGE_1_CONTAINER).unbind('click').fadeOut('fast', _.bind(function() {

			$(this.el).find(SelectView.IMAGE_1_CONTAINER + ' ' + SelectView.INFO_CONTAINER).empty().html(item1.get('name')).fadeIn('fast');
			$(this.el).find(SelectView.IMAGE_2_CONTAINER + ' ' + SelectView.INFO_CONTAINER).empty().html(item2.get('name')).fadeIn('fast');

			$(this.el).find(SelectView.IMAGE_1_CONTAINER).css('background-image', 'url(' + item1.get('source') + ')').fadeIn('fast');
			$(this.el).find(SelectView.IMAGE_2_CONTAINER).css('background-image', 'url(' + item2.get('source') + ')').fadeIn('fast');
			

			$(this.el).find(SelectView.IMAGE_1_CONTAINER).click(_.bind(function() {
				this.next(item1);
			}, this)).fadeIn('fast');
			$(this.el).find(SelectView.IMAGE_2_CONTAINER).click(_.bind(function() {
				this.next(item2);
			}, this)).fadeIn('fast');

			$(SelectView.BACKGROUND_SELECTOR).transition({
				"background-color": 'rgb(' + dominantColor.join(',') + ')'
			});

		}, this));

	}

}, {

	IMAGE_1_CONTAINER: '.image1',
	IMAGE_2_CONTAINER: '.image2',
	INFO_CONTAINER: '.info',

	BACKGROUND_SELECTOR: '.carousel .item.active .background',
	DEFAULT_COLOR: [59,89,152],

	LOADER_GIF_SRC: 'img/loader.gif'

});


