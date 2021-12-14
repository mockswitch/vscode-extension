import * as vscode from 'vscode';
import { WebAppPanel } from './WebAppPanel';
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const config = vscode.workspace.getConfiguration('mockswitch.node');
let runningStatus = null;

export function activate(context) {
	const outputChannel = vscode.window.createOutputChannel(config.outputWindowName);
	// test for running process
	if (runningStatus) {
		vscode.window.showErrorMessage('Process is already running!')
		return;
	}

	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const dirName = path.dirname(editor.document.fileName);
	if (!dirName || dirName === '' || dirName === '.') {
		vscode.window.showWarningMessage('Unknown working directory! Try to save the file before running.')
		return;
	}

	const selection = editor.selection;
	let text = editor.document.getText(selection);
	if ((text === '' && config.executeFileOrSelection === 'both') || config.executeFileOrSelection === 'file') {
		text = editor.document.getText();
	}
	if (config.includeCode) {
		text = config.includeCode.replace('${execPath}', dirName) + ';\n' + text;
	}

	// get config params object
	const options = {};
	if (config.env) {
		options.env = config.env;
	}
	// get cwd from config, replace placeholder and add it to the params object
	options.cwd = (typeof config.cwd === 'string') ? config.cwd.replace('${execPath}', dirName) : dirName // eslint-disable-line no-template-curly-in-string

	// set tempfile
	const tmpFile = path.join(dirName, `node_${require('crypto').createHash('sha1').update(Math.random().toString()).digest('hex').substr(0, 13)}.tmp`)
	// wirte code in temp file and exec the file with node
	fs.writeFileSync(tmpFile, text);

	let args = [tmpFile];
	if (Array.isArray(config.args) && config.args.length > 0) {
		args = args.concat(config.args);
	}

	if (Array.isArray(config.options) && config.options.length > 0) {
		args = config.options.concat(args);
	};

	const startTime = new Date();
	const nodeBin = (typeof config.nodeBin === 'string') ? config.nodeBin : 'node';

	runningStatus = vscode.window.setStatusBarMessage('Running...');
	outputChannel.show(true)
	if (config.clearOutput) {
		outputChannel.clear()
	}
	if (config.showInfo) {
		outputChannel.appendLine('Info: Start process (' + startTime.toLocaleTimeString() + ')')
	}
	// spawn new node.js process
	process = spawn(nodeBin, args, options);

	// process event handlers
	process.stdout.on('data', function (data) {
		if (!config.showStdout) return;
		outputChannel.append(data.toString());
	})
	process.stderr.on('data', function (data) {
		if (!config.showStderr) return;
		outputChannel.appendLine('Error: ');
		outputChannel.appendLine(data.toString());
	})
	process.on('close', function () {
		fs.unlink(tmpFile, function (err) {
			if (err) {
				outputChannel.appendLine('Error: Processfile cannot be deleted (mm:ss:fff)')
			}
			if (runningStatus) {
				if (config.showInfo) {
					outputChannel.appendLine('Info: Execution time ' + getDuration(startTime, new Date()) + ' (mm:ss:fff)')
				}
				runningStatus.dispose();
				runningStatus = null;
			}
		});
	});
	process.on('error', function (processError) {
		fs.unlink(tmpFile, function (err) {
			if (err) {
				outputChannel.appendLine('Error: Processfile cannot be deleted (mm:ss:fff)')
			}
			outputChannel.appendLine('Process error: ')
			outputChannel.appendLine(processError.toString())
			if (config.showInfo) {
				outputChannel.appendLine('Info: End process with errors! Execution time ' + getDuration(startTime, new Date()) + ' (mm:ss:fff)')
			}
			if (runningStatus) {
				runningStatus.dispose();
				runningStatus = null;
			}
		});
	});


	context.subscriptions.push(
		vscode.commands.registerCommand(
			'vscodevuecli:openMockswitch', () => {
				WebAppPanel.createOrShow(context.extensionUri);
			}
		)
	);
}

export function deactivate() { }

// get a duration as Timestring (mm:ss.fff)
function getDuration(start, end) {
	const duration = new Date(end - start)
	return numPad(duration.getMinutes(), 1) + ':' + numPad(duration.getSeconds(), 2) + ':' + numPad(duration.getMilliseconds(), 3)
}

// Numberpadding
function numPad(number, size) {
	let result = number + ''
	while (result.length < size) {
		result = '0' + result
	}
	return result
}
