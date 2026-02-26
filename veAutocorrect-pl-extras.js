/**
 * NAC sequences specific for Polish Wikipedia.
 * 
 * See also: https://github.com/Eccenux/veAutocorrect/blob/master/DEV.md#inserting-stuff-to-ve-surface
 */
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
	nac.add({from:'(c)', to:'©'});

	const refsList = helpers.refsList();
	const notesList = helpers.tpl({
		target: {
			href: 'Szablon:Uwagi',
			wt: 'Uwagi',
		},
	}, true);
	const blankList = helpers.list();
	
	// helper mapping
	const h2 = helpers.h2;
	
	// extra
	nac.add({start:'=zob', to:[h2('Zobacz też', true), blankList].flat()});
	nac.add({start:'=zt', to:[h2('Zobacz też', true), blankList].flat()});
	nac.add({start:'=u', to:[h2('Uwagi', true), notesList].flat()});
	nac.add({start:'=p', to:[h2('Przypisy', true), refsList].flat()});
	nac.add({start:'=b', to:[h2('Bibliografia', true), blankList].flat()});
	nac.add({start:'=lz', to:[h2('Linki zewnętrzne', true), blankList].flat()});
	nac.add({start:'=lnk', to:[h2('Linki zewnętrzne', true), blankList].flat()});

	// '{p' -> {{Przypisy}}
	/**
	nac.add({
		from: '{p',
		to: tpl({
			target: {
				href: 'Szablon:Przypisy',
				wt: 'Przypisy'
			},
			//params: {}
		})
	});
	/**/
	nac.add({
		from: '{p',
		to: refsList,
	});
	
	// '=z+' -> Sekcyjne comobo
	nac.add({
		start:'=z+',
		to: [
			h2('Zobacz też', true),
			blankList,
			h2('Uwagi', true),
			notesList,
			h2('Przypisy', true),
			refsList,
			h2('Bibliografia', true),
			blankList,
			h2('Linki zewnętrzne', true),
			blankList,
		].flat(), // Uwaga! Funkcja flat spłaszcza tablicę, czyli z tablicy tablic elementów ([[a],[b]]) robi tablicę elementów ([a,b]).
	});
});
