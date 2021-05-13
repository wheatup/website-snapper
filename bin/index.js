#!/usr/bin/env node

import chalk from 'chalk';
import boxen from 'boxen';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import puppeteer from 'puppeteer';
import terminalImage from 'terminal-image';
import fs from 'fs';

const logBox = text => {
	console.log(boxen(text, {
		padding: 1,
		borderStyle: "round",
		borderColor: "green"
	}));
};

const snapURL = url => {
	url = url.replace(/^(?!https?:\/\/)/, 'https://');
	if (!/\./[Symbol.match](url)) {
		url += '.com';
	}
	logBox(chalk.white('Opening ') + chalk.green(url) + chalk.white(' ...'));

	(async () => {
		const browser = await puppeteer.launch({
			defaultViewport: {
				width: Math.max(process.stdout.columns * 8, 800),
				height: Math.max(process.stdout.columns * 8 * (9 / 16), 800 * (9 / 16))
			}
		});
		const page = await browser.newPage();

		try {
			const fileName = `__temp__${~~(Math.random() * 1e8)}.png`
			await page.goto(url);
			const dimensions = await page.evaluate(() => ({
				width: document.documentElement.clientWidth,
				height: document.documentElement.clientHeight,
				deviceScaleFactor: window.devicePixelRatio,
			}));
			await page.screenshot({ path: fileName, width: dimensions.width, height: dimensions.height });
			console.log(await terminalImage.file(fileName));
			fs.unlink(fileName, () => { });
		} catch (ex) {
			console.log('Error: ' + ex.message);
		} finally {
			await browser.close();
			process.exit();
		}
	})();
};

const argv = hideBin(process.argv);

if (argv.length === 1) {
	snapURL(argv[0])
} else {
	yargs()
		.command(
			'<url>',
			'Website URL',
			yargs => yargs.option('url', {
				alias: 'u',
				describe: 'The url to take a snapshot of'
			}),
			argv => {
				snapURL(argv.url);
			}
		)
		.demandCommand(1)
		.argv;
}