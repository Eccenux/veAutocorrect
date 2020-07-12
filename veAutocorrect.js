/**
 * Autocorrection features in Visual Editor.
 * 
 * Polska instrukcja:
 *		https://pl.wikipedia.org/wiki/WP:NAC
 * 
 * Version history and technical docs:
 *		https://github.com/Eccenux/veAutocorrect
 * 
 * Authors: Maciej Nux Jaros, Schnark.
 * 
 * <nowiki>
 */
/*global mediaWiki, OO, ve*/
(function (mw) {
	"use strict";

	var version = '2.1.3';

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
			var textArray = text.split('');
			return [{type: 'paragraph'}].concat(textArray);
		}
		
		/**
		 * Standard header.
		 * 
		 * E.g.: `to: h2('See also'),`
		 */
		h2(text, skipParagraph) {
			var head = [
				{type: 'heading', attributes: {level: 2}},
				text,
				{type: '/heading'},
			];
			var p = [
				{type: 'paragraph'},
				{type: '/paragraph'},
			];
			return skipParagraph ? head : head.concat(p);
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
			var tplType = block ? 'mwTransclusionBlock' : 'mwTransclusionInline';
			return [
				{
					type: tplType,
					attributes: {
						mw: {
							parts: [ { template: template } ]
						}
					}
				},
				{ type: '/' + tplType },
			];
		}
	}

	/**
	 * Autocorrect class (export).
	 */
	var veNuxAutocorrect = {
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
			autoCorrectFromTo(config.from, config.to);
		},
		
		_onReady: function() {
			for (var i = 0; i < this._configs.length; i++) {
				this._run(this._configs[i]);
			}
			this._configs = [];
			this._ready = true;
			mw.hook('userjs.veNuxAutocorrect.ready').fire(veNuxAutocorrect, veNuxAutocorrect.helpers);
		},
	};
	mw.hook('userjs.veNuxAutocorrect').fire(veNuxAutocorrect, veNuxAutocorrect.helpers);

	// shorthand for helpers
	var h = veNuxAutocorrect.helpers;

	// Usage info helper
	// This is only for quick death, expected to be re-checked on page reload e.g. from wiki-code editor.
	var usageInfoDone = false;
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

		var target = ve.init.target;
		var myInfo = "[[WP:NAC]]";
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

	var customVeClassesReady = false;

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
			var execResult;
			if (this.data instanceof RegExp) {
				execResult = this.data.exec(plaintext);
				return execResult && new ve.Range(offset - execResult[1].length, offset);
			}
			return ReSequence.parent.prototype.match.apply(this, arguments);
		};
	}

	/**
	 * autoCorrectFromTo.
	 * 
	 * when the user enters "from" change it to "to"
	 * @param from can be a string, a regular expression of the form /foo(bar)/ or an array of data
	 * @param to can be a string or an array of data
	 */
	function autoCorrectFromTo (from, to) {
		//get a unique name, we use it for both the command and the sequnce
		var name = 'nuxAutoCorrectCommand-' + (autoCorrectCommandCount++);
		//create and register the command
		ve.ui.commandRegistry.register(
			new AutoCorrectCommand(name, to)
		);
		//let the surface know that there is a new command that can be executed
		ve.init.target.getSurface().commands.push(name);
		//create and register the sequence
		ve.ui.sequenceRegistry.register(
			new ReSequence(/*sequence*/ name, /*command*/ name, from, 0, true)
		);
	}
	var autoCorrectCommandCount = 0;

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
					{type: 'paragraph'}
				]);
			break;
			case 'plwiki':
				var iso = (new Date()).toISOString();
				var ym = iso.substr(0,7);
				autoCorrectFromTo('{fd',
					h.tpl({
						target: {
							href: 'Szablon:Fakt',
							wt: 'fakt'
						},
						params: {
							'data': {
								wt: ym
							}
						}
					})
				);
			break;
		}
		
		// run custom commands
		veNuxAutocorrect._onReady();
	}

	//we just need to run once the editor is ready
	//don't care about dependencies, they should be fine when activation is complete
	mw.hook('ve.activationComplete').add(function () {
		var alreadyDone = initCustomVeClasses();
		if (!alreadyDone) {
			initAutoCorrect(mw.config.get('wgContentLanguage'), mw.config.get('wgDBname'));
		}
	});

})(mediaWiki);
//</nowiki>
