# veAutocorrect

Autocorrection features in Visual Editor.

PL: Informacje o użytkowniu
----------------------------

Dokumentacja użytkowa znajduje się na Polskiej Wikipedii: [WP:NAC](https://pl.wikipedia.org/wiki/WP:NAC).

Hooks and custom sequences
----------------------------

### Hooks ###

The script provides ability for you to hook into the script and add more sequences. Note that it is not important for you if a hook was already fired or not. Your function will be called even if the hook was fired 

There are two hooks:
```js
// when `veNuxAutocorrect` could be used (not recomended though)
mw.hook('userjs.veNuxAutocorrect')

// when `veNuxAutocorrect` is fully ready and is ready to accept sequences
mw.hook('userjs.veNuxAutocorrect.ready');
```

Both get two parameters:

1. `nac` (`veNuxAutocorrect`) -- object with `add` function.
2. `helpers` (`Helpers` instance) -- object that provide functions to easily add advanced sequences.

### Example sequences ###

The easiest example (replace "(c)" with "©"):
```js
importScript('User:Nux/veAutocorrect.js');
// custom sequences
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	nac.add({from:'(c)', to:'©'});
});
```

This replacement work in any place. You can any number of such sequences.
```js
// custom sequences
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	nac.add({from:'(c)', to:'©'});
	nac.add({from:'>=', to:'≥'});
	nac.add({from:'<=', to:'≤'});
});
```

### Resolving conflicting sequences ###

Note that for each one a prefix should be unique. So for example If you already have `from:'<='` then `from:'<=>'` will not work. You can overcome this by adding space after your sequence. So e.g.:
```js
// custom sequences
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	nac.add({from:'(c)', to:'©'});
	nac.add({from:'>= ', to:'≥ '});
	nac.add({from:'<= ', to:'≤ '});
	nac.add({from:'<=> ', to:'⇔ '});
});
```

### Templates ###

The helpers can either be used in `from` or `to` parameter. You can map helpers to a shorter version like shown in the example below. 
```js
// custom sequences
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	// basic sequence
	nac.add({from:'(c)', to:'©'});
	
	// helper mapping (short)
	var p = helpers.p;
	var h2 = helpers.h2;
	var tpl = helpers.tpl;
});
```


So if you add a cleanup template a lot you might want to add "{c}" sequence.
```js
// custom sequences
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	// basic sequence
	nac.add({from:'(c)', to:'©'});
	
	// helper mapping (short)
	var p = helpers.p;
	var h2 = helpers.h2;
	var tpl = helpers.tpl;

	// '{c}' -> {{Cleanup}}
	nac.add({
		from: '{c}',
		to: tpl({
			target: {
				href: 'Template:Cleanup',
				wt: 'Cleanup'
			},
		})
	});
	
});
```

If you prefer a template with a parameter:
```js
// custom sequences
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	// helper mapping (short)
	var p = helpers.p;
	var h2 = helpers.h2;
	var tpl = helpers.tpl;

	// '{c=pov}' -> {{Cleanup|reason=The neutrality of this article is disputed.}}
	nac.add({
		from: '{c}',
		to: tpl({
			target: {
				href: 'Template:Cleanup',
				wt: 'Cleanup'
			},
			params: {
				'reason': {
					wt: 'The neutrality of this article is disputed.'
				}
			}
		})
	});
});
```

Citation needed with date (note that date will be resolved upon saving changes).
```js
// custom sequences
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	// helper mapping (short)
	var p = helpers.p;
	var h2 = helpers.h2;
	var tpl = helpers.tpl;

	// '{cn}' -> {{Citation needed|date=...}}
	nac.add({
		from: '{cn}',
		to: tpl({
			target: {
				href: 'Template:Citation needed',
				wt: 'Citation needed'
			},
			params: {
				date: {
					wt: '{{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}'
				}
			}
		})
	});
});
```

Also note that `wt:` stands for wikitext. Using wikitext in parametrs should work.

Helpers reference
-----------------

```js
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
		p(text);
		
		/**
		 * Standard header.
		 * 
		 * E.g.: `to: h2('See also'),`
		 */
		h2(text, skipParagraph);
		
		/**
		 * Inline or block template.
		 * 
		 * Note! Inline templates should be inside a paragraph.
		 * E.g.:
		 * tpl({
				target: {
					href: 'Szablon:Przypisy',
					wt: 'Przypisy'
				},
				//params: {}
			})
		 */
		tpl(template, block);
	}
```


License and authors
----------------------------

Authors:
* Fork: [Maciej Nux Jaros](https://pl.wikipedia.org/wiki/Wikipedysta:Nux).
* Original: [Schnark](https://de.wikipedia.org/wiki/User:Schnark/js/veAutocorrect).


License: [CC-BY-SA](https://creativecommons.org/licenses/by-sa/3.0/).
