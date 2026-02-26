/**
 * Release (deploy to all copies).
 */
import {DeployConfig, WikiployLite} from 'wikiploy';

import * as botpass from './bot.config.mjs';
import { version } from './version.js';
const ployBot = new WikiployLite(botpass);

// custom summary
ployBot.summary = () => {
	return version.summary;
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