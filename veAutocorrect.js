/**
 * Autocorrection features in Visual Editor.
 * 
 * Polska instrukcja:
 * https://pl.wikipedia.org/wiki/WP:NAC
 * 
 * Version history and technical docs:
 * https://github.com/Eccenux/veAutocorrect
 * 
 * Authors:
 * Maciej Nux Jaros, Schnark.
 * 
 * Deployed with love using Wikiploy:
 * [[Wikipedia:Wikiploy]]
 * 
 * <nowiki>
 */
/*global mediaWiki, OO, ve*/
(function (mw) {
	"use strict";

	let version = '3.0.0';

	/**
	 * Helpers for defining replacements.
	 */
	class Helpers {
		/**
		 * p-starter
		 * 
		 * Note! The paragraph is not closed, so that it can be used in `from`.
		 * E.g.: `from: p('=z+'),`
		 * 
		 * Normally paragraphs should be closed (see h2).
		 */
		p(text) {
			let textArray = text.split('');
			return [{type: 'paragraph'}, ...textArray];
		}
		/**
		 * Full paragraph (text can be empty).
		 * @param {string|Array[]} items String OR array of data.
		 */
		pFull(text) {
			let res = [{ "type": "paragraph" }];
			if (typeof text === 'string' && text.length) {
				res.push(...text.split(''));
			} else if (Array.isArray(text)) {
				res.push(...text);
			}
			res.push({ "type": "/paragraph" });
			return 	res;
		}

		/**
		 * List of items.
		 * @param {string[]|Array[]} items String array OR array of data.
		 */
		list(items = [], style = "bullet") {
			let res = [
				{ "type": "list", "attributes": { "style": style } },
			];
			if (!Array.isArray(items) || !items.length) {
				items = [''];
			}
			for (let item of items) {
				res.push(
					{ "type": "listItem" },
					...(Array.isArray(item) ? item : this.pFull(item)),
					{ "type": "/listItem" }
				);
			}
			res.push({ "type": "/list" });
			return res;
		}

		/**
		 * References.
		 */
		refsList(group = '') {
			if (typeof group !== 'string') {
				group = '';
			}
			return [
				{
					"type": "mwReferencesList",
					"attributes": {
						"listGroup": "mwReference/",
						"refGroup": group,
						"isResponsive": true,
					},
				},
				{
					"type": "/mwReferencesList",
				},
			];
		}
		
		/**
		 * Standard header.
		 * 
		 * E.g.: `to: h2('See also'),`
		 */
		h2(text, skipParagraph) {
			let head = [
				{type: 'heading', attributes: {level: 2}},
				...text.split(''),
				{type: '/heading'},
			];
			return skipParagraph ? head : head.push({type: 'paragraph'}, {type: '/paragraph'});
		}
		
		/**
		 * Inline or block template.
		 * 
		 * Note! Inline templates should be inside a paragraph.
		 * E.g.:
		 * ```
		 * tpl({
				target: {
					href: 'Szablon:Przypisy',
					wt: 'Przypisy'
				},
				//params: {}
			})
			* ```
			*/
		tpl(template, block) {
			let tplType = block ? 'mwTransclusionBlock' : 'mwTransclusionInline';
			return [
				{
					type: tplType,
					attributes: {
						mw: {
							parts: [ { template: template } ],
						},
					},
				},
				{ type: '/' + tplType },
			];
		}
	}

	/**
	 * Autocorrect class (export).
	 */
	let veNuxAutocorrect = {
		version: version,
		
		helpers: new Helpers(),
		
		_ready: false,
		_configs: [],
		
		/**
		 * Add replacemnt rule.
		 *
		 * Examples in documentation.
		 * See also: `autoCorrectFromTo`.
		 */
		addReplacements: function(config) {
			if (this._ready) {
				this._run(config);
			} else {
				this._configs.push(config);
			}
		},
		/**
		 * Alias `addReplacements`.
		 */
		add: function(config) {
			this.addReplacements(config);
		},
		
		_run: function(config) {
			let from = ('start' in config) ? this.helpers.p(config.start) : config.from;
			autoCorrectFromTo(from, config.to);
		},
		
		_onReady: function() {
			for (let i = 0; i < this._configs.length; i++) {
				this._run(this._configs[i]);
			}
			this._configs = [];
			this._ready = true;
			mw.hook('userjs.veNuxAutocorrect.ready').fire(veNuxAutocorrect, veNuxAutocorrect.helpers);
		},
	};
	mw.hook('userjs.veNuxAutocorrect').fire(veNuxAutocorrect, veNuxAutocorrect.helpers);

	// shorthand for helpers
	let h = veNuxAutocorrect.helpers;

	// Usage info helper
	// This is only for quick death, expected to be re-checked on page reload e.g. from wiki-code editor.
	let usageInfoDone = false;
	/**
	 * Append gadget usage info.
	 * 
	 * Adds documentation page shortcut in summary.
	 */
	function appendUsageInfo() {
		// quick death
		if (usageInfoDone) {
			//console.log('[NAC] appendUsageInfo: quick death');
			return;
		}

		if (!(ve.init && typeof ve.init.target === 'object')) {
			//console.log('[NAC] appendUsageInfo: no target');
			return;
		}

		let target = ve.init.target;
		let myInfo = "[[WP:NAC]]";
		// append if not already
		if (typeof target.initialEditSummary === 'string' && target.initialEditSummary.length) {
			//console.log('[NAC] appendUsageInfo: append?');
			if (target.initialEditSummary.indexOf(myInfo) < 0) {
				//console.log('[NAC] appendUsageInfo: append');
				target.initialEditSummary += ", " + myInfo;
			}
		// create when empty
		} else {
			//console.log('[NAC] appendUsageInfo: create info');
			target.initialEditSummary = myInfo;
		}
		usageInfoDone = true;
	}

	/**
	 * AutoCorrectCommand.
	 * 
	 * Command to replace selected content and place the cursor after it.
	 * 
	 * inherit from ve.ui.Command, and override execute
	 */
	function AutoCorrectCommand (name, content) {
		AutoCorrectCommand.parent.call(this, name);
		this.content = content;
	}

	/**
	 * ReSequence.
	 * 
	 * like ve.ui.Sequence, with the difference that for regular expressions
	 * of the form /foo(bar)/ only the parentheses is used as Range, not the whole expression
	 */
	function ReSequence () {
		ReSequence.parent.apply(this, arguments);
	}

	let customVeClassesReady = false;

	/**
	 * Init classes when ready ve.ui is ready.
	 * 
	 * @returns true if already there.
	 */
	function initCustomVeClasses() {
		// avoid re-run when VE re-opened without reloading page
		if (customVeClassesReady) {
			return true;
		}
		customVeClassesReady = true;
		
		OO.inheritClass(AutoCorrectCommand, ve.ui.Command);
		AutoCorrectCommand.prototype.execute = function (surface) {
			surface.getModel().getFragment().insertContent(this.content).collapseToEnd().select();
			appendUsageInfo();
			return true;
		};
		
		OO.inheritClass(ReSequence, ve.ui.Sequence);
		ReSequence.prototype.match = function (data, offset, plaintext) {
			let execResult;
			if (this.data instanceof RegExp) {
				execResult = this.data.exec(plaintext);
				return execResult && new ve.Range(offset - execResult[1].length, offset);
			}
			return ReSequence.parent.prototype.match.apply(this, arguments);
		};
	}

	let autoCorrectCommandCount = 0;
	/**
	 * autoCorrectFromTo.
	 * 
	 * when the user enters "from" change it to "to"
	 * @param from can be a string, a regular expression of the form /foo(bar)/ or an array of data
	 * @param to can be a string or an array of data
	 */
	function autoCorrectFromTo (from, to) {
		//get a unique name, we use it for both the command and the sequnce
		let name = 'nuxAutoCorrectCommand-' + (autoCorrectCommandCount++);
		//create and register the command
		ve.ui.commandRegistry.register(
			new AutoCorrectCommand(name, to)
		);
		//let the surface know that there is a new command that can be executed
		ve.init.target.getSurface().commands.push(name);
		//create and register the sequence
		ve.ui.sequenceRegistry.register(
			new ReSequence(/*sequence*/ name, /*command*/ name, from, 0, { setSelection: true })
		);
	}

	/**
	 * Init commands.
	 */
	function initAutoCorrect (lang, wiki) {
		//define what should be autocorrected

		//for all languages and projects
		autoCorrectFromTo('--', '–');
		autoCorrectFromTo('–-', '—');
		autoCorrectFromTo('...', '…');
		autoCorrectFromTo('<<', '«');
		autoCorrectFromTo('>>', '»');
		autoCorrectFromTo('->', '→');
		autoCorrectFromTo(/(?:^|[^\d])(1\/2 )$/, '½ ');
		autoCorrectFromTo(/(?:^|[^\d])(1\/4 )$/, '¼ ');
		autoCorrectFromTo(/(?:^|[^\d])(3\/4 )$/, '¾ ');
		autoCorrectFromTo('+-', '±');
		/*
		autoCorrectFromTo(/\d(')/, '′');
		autoCorrectFromTo(/\D(')/, '’');
		autoCorrectFromTo(/\d(")/, '″');
		*/
		
		//depending on the content language
		switch (lang) {
			case 'de':
				autoCorrectFromTo(/(?:^|[( \n])(")$/, '„');
				autoCorrectFromTo(/[^\d( \n](")$/, '“');
				break;
				// disabled per en.wiki policies [[:en:MOS:PUNCT]]
			/*
			case 'en':
				autoCorrectFromTo(/(?:^|[( \n])(")$/, '“');
				autoCorrectFromTo(/[^\d( \n](")$/, '”');
			break;
			*/
			case 'pl':
				autoCorrectFromTo(/(?:^|[( \n])(")$/, '„');
				autoCorrectFromTo(/[^\d( \n](")$/, '”');
				break;
		}
		
		//depending on the wiki
		/*jshint onecase: true*/
		switch (wiki) {
			case 'dewiki':
				autoCorrectFromTo([{type: 'paragraph'}, '=', 'w'], [
					{type: 'heading', attributes: {level: 2}},
					'W', 'e', 'b', 'l', 'i', 'n', 'k', 's',
					{type: '/heading'},
					{type: 'paragraph'},
				]);
				break;
			case 'plwiki':
				{
					let iso = (new Date()).toISOString();
					let ym = iso.substr(0,7);
					autoCorrectFromTo('{fd',
						h.tpl({
							target: {
								href: 'Szablon:Fakt',
								wt: 'fakt',
							},
							params: {
								'data': {
									wt: ym,
								},
							},
						})
					);
				}
				break;
		}
		
		// run custom commands
		veNuxAutocorrect._onReady();
	}

	//we just need to run once the editor is ready
	//don't care about dependencies, they should be fine when activation is complete
	mw.hook('ve.activationComplete').add(function () {
		let alreadyDone = initCustomVeClasses();
		if (!alreadyDone) {
			initAutoCorrect(mw.config.get('wgContentLanguage'), mw.config.get('wgDBname'));
		}
	});

})(mediaWiki);
//</nowiki>
