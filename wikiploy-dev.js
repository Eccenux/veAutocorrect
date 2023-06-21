/**
 * Dev/staging deploy.
 */
import {DeployConfig, Wikiploy} from 'wikiploy';

const ployBot = new Wikiploy();

// custom summary
ployBot.prepareSummary = () => {
	return '#Wikiploy' + ' v2.1.5: wikiploy test';
}

(async () => {
	const configs = [];
	configs.push(new DeployConfig({
		src: 'veAutocorrect.js',
		dst: '~/veAutocorrect.dev.js',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});