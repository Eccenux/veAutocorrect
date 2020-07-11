/**
 * Autocorrection features in Visual Editor.
 * 
 * Original dokumentation:
 * https://de.wikipedia.org/wiki/User:Schnark/js/veAutocorrect
 * 
 * <nowiki>
 */
/*global mediaWiki, OO, ve*/
(function (mw) {
"use strict";

function initAutoCorrect (lang, wiki) {

	//Command to replace selected content and place the cursor after it
	//inherit from ve.ui.Command, and override execute
	function AutoCorrectCommand (name, content) {
		AutoCorrectCommand.parent.call(this, name);
		this.content = content;
	}
	OO.inheritClass(AutoCorrectCommand, ve.ui.Command);
	AutoCorrectCommand.prototype.execute = function (surface) {
		surface.getModel().getFragment().insertContent(this.content).collapseToEnd().select();
		return true;
	};

	//like ve.ui.Sequence, with the difference that for regular expressions
	//of the form /foo(bar)/ only the parentheses is used as Range, not the whole expression
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
	//when the user enters "from" change it to "to"
	//from can be a string, a regular expression of the form /foo(bar)/ or an array of data
	//to can be a string or an array of data
	function autoCorrectFromTo (from, to) {
		//get a unique name, we use it for both the command and the sequnce
		var name = 'schnarkAutoCorrectCommand-' + (autoCorrectCommandCount++);
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

	//define what should be autocorrected

	//for all languages and projects
	autoCorrectFromTo('--', '–');
	autoCorrectFromTo('–-', '—');
	autoCorrectFromTo('...', '…');
	autoCorrectFromTo('<<', '«');
	autoCorrectFromTo('>>', '»');
	autoCorrectFromTo('->', '›');
	autoCorrectFromTo('1/2', '1');
	autoCorrectFromTo('1/4', '1');
	autoCorrectFromTo('3/4', '3');
	autoCorrectFromTo('+-', '±');
	autoCorrectFromTo(/\d(')/, ''');
	autoCorrectFromTo(/\D(')/, '’');
	autoCorrectFromTo(/\d(")/, '”');
	//depending on the content language
	switch (lang) {
	case 'de':
		autoCorrectFromTo(/(?:^|[( \n])(")/, '„');
		autoCorrectFromTo(/[^\d( \n](")/, '“');
		break;
	case 'en':
		autoCorrectFromTo(/(?:^|[( \n])(")/, '“');
		autoCorrectFromTo(/[^\d( \n](")/, '”');
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
	}
}

//we just need to run once the editor is ready
//don't care about dependencies, they should be fine when activation is complete
mw.hook('ve.activationComplete').add(function () {
	initAutoCorrect(mw.config.get('wgContentLanguage'), mw.config.get('wgDBname'));
});

})(mediaWiki);
//</nowiki>
