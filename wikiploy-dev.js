/**
 * Dev/staging deploy.
 */
import {DeployConfig, Wikiploy} from 'wikiploy';

const ployBot = new Wikiploy();

// custom summary
ployBot.summary = () => {
	return 'v2.1.9: beauty mark';
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