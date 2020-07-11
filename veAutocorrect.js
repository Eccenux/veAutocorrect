/**
 * Autocorrection features in Visual Editor.
 * 
 * Polska dokumentacja:
 *		https://pl.wikipedia.org/wiki/User:Nux/veAutocorrect
 * English documentation:
 *		https://en.wikipedia.org/wiki/User:Nux/veAutocorrect
 * 
 * Original author by Schnark.
 *		https://de.wikipedia.org/wiki/User:Schnark/js/veAutocorrect
 * 
 * <nowiki>
 */
/*global mediaWiki, OO, ve*/
(function (mw) {
"use strict";

/**
 * Autocorrect class (export).
 */
window.veNuxAutocorrect = {
	version: 2.0,
	
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
	
	_run: function(config) {
		autoCorrectFromTo(config.from, config.to);
	},
	
	_onReady: function() {
		for (var i = 0; i < this._configs.length; i++) {
			this._run(this._configs[i]);
		}
		this._configs = [];
		this._ready = true;
	},
};

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
OO.inheritClass(AutoCorrectCommand, ve.ui.Command);
AutoCorrectCommand.prototype.execute = function (surface) {
	surface.getModel().getFragment().insertContent(this.content).collapseToEnd().select();
	return true;
};

/**
 * ReSequence.
 * 
 * like ve.ui.Sequence, with the difference that for regular expressions
 * of the form /foo(bar)/ only the parentheses is used as Range, not the whole expression
 */
function ReSequence () {
	ReSequence.parent.apply(this, arguments);
}
OO.inheritClass(ReSequence, ve.ui.Sequence);
ReSequence.prototype.match = function (data, offset, plaintext) {
	var execResult;
	if (this.data instanceof RegExp) {
		execResult = this.data.exec(plaintext);
		return execResult && new ve.Range(offset - execResult[1].length, offset);
	}
	return ReSequence.parent.prototype.match.apply(this, arguments);
};

var autoCorrectCommandCount = 0;
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
			autoCorrectFromTo('{fd', [
				{
					type: 'mwTransclusionInline',
					attributes: {
						mw: {
							parts: [ {
								template: {
									target: {
										href: 'Szablon:Fakt',
										wt: 'fakt'
									},
									params: {
										'data': {
											wt: ym
										}
									}
								}
							} ]
						}
					}
				},
				{ type: '/mwTransclusionInline' },
			]);
		break;
	}
	
	// run custom commands
	veNuxAutocorrect._onReady();
}

//we just need to run once the editor is ready
//don't care about dependencies, they should be fine when activation is complete
mw.hook('ve.activationComplete').add(function () {
	initAutoCorrect(mw.config.get('wgContentLanguage'), mw.config.get('wgDBname'));
});

})(mediaWiki);
//</nowiki>
