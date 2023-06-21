/**
 * Release (deploy to all copies).
 */
import {DeployConfig, Wikiploy} from 'wikiploy';

const ployBot = new Wikiploy();

// custom summary
ployBot.prepareSummary = () => {
	return '#Wikiploy' + ' v2.1.5: wikiploy test';
}

(async () => {
	const configs = [];

	// veAutocorrect.js
	configs.push(new DeployConfig({
		src: 'veAutocorrect.js',
		dst: '~/veAutocorrect.dev.js',
	}));
	configs.push(new DeployConfig({
		src: 'veAutocorrect.js',
		dst: '~/veAutocorrect.js',
	}));
	configs.push(new DeployConfig({
		src: 'veAutocorrect.js',
		dst: 'MediaWiki:Gadget-NAC.js',
	}));

	// extras, pl
	configs.push(new DeployConfig({
		src: 'veAutocorrect-pl-extras.js',
		dst: 'MediaWiki:Gadget-NAC-extras.js',
	}));
	
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});