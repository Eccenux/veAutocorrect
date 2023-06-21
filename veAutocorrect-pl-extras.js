/**
 * NAC sequences specific for Polish Wikipedia.
 */
mw.hook('userjs.veNuxAutocorrect.ready').add(function (nac, helpers) {
    nac.add({from:'(c)', to:'©'});
    
    // helper mapping
    const p = helpers.p;
    const h2 = helpers.h2;
    const tpl = helpers.tpl;
    // extra
    function addHead(config) {
	    nac.add({
		    from: p(config.start),
		    to: h2(config.to),
		});
    }
    addHead({start:'=zob', to:'Zobacz też'});
    addHead({start:'=zt', to:'Zobacz też'});
    addHead({start:'=p', to:'Przypisy'});
    addHead({start:'=b', to:'Bibliografia'});
    addHead({start:'=lz', to:'Linki zewnętrzne'});
    addHead({start:'=lnk', to:'Linki zewnętrzne'});

	// '{p' -> {{Przypisy}}
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
	
	// '=z+' -> Sekcyjne comobo
    nac.add({
	    from: p('=z+'),
	    to: [
			h2('Zobacz też'),
			h2('Przypisy', true),
			tpl({
				target: {
					href: 'Szablon:Przypisy',
					wt: 'Przypisy'
				},
			}, true),
			h2('Bibliografia'),
			h2('Linki zewnętrzne'),
		].flat(),
	});
});
