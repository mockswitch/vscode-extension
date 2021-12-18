const vscode = require('vscode');
const os = require('os');
const { WebAppPanel } = require('./launch-app');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const config = vscode.workspace.getConfiguration('mockswitch.node');
let process;
function activate(context) {


	context.subscriptions.push(
		vscode.commands.registerCommand(
			'mockswitch:openMockswitch', () => {

				const outputChannel = vscode.window.createOutputChannel(config.outputWindowName);
				// test for running process
				if (process) {
					vscode.window.showInformationMessage('Welcome to Mockswitch');
				} else {
					let opsys = os.platform();
					if (opsys == "darwin") {
						opsys = "mac";
					} else if (opsys == "win32" || opsys == "win64") {
						opsys = "win";
					} else if (opsys == "linux") {
						opsys = "linux";
					}
					let enginePath = ``;
					if(opsys === 'mac'){
						enginePath = `node14-macos`;
					}else if(opsys === 'win'){
						enginePath = `node14-win.exe`;
					}
					const dirName = path.resolve(__dirname, `../dist-web/${enginePath}`);

					// get config params object
					const options = {};
					if (config.env) {
						options.env = config.env;
					}

					let args = [dirName];
					if (Array.isArray(config.args) && config.args.length > 0) {
						args = args.concat(config.args);
					}

					if (Array.isArray(config.options) && config.options.length > 0) {
						args = config.options.concat(args);
					};
					options.detached = true;
					const startTime = new Date();
					runningStatus = vscode.window.setStatusBarMessage('Running...');
					outputChannel.show(true)
					if (config.clearOutput) {
						outputChannel.clear()
					}
				
					setTimeout(() => {

						try {
							process = spawn(`${dirName}`, []);

							// process event handlers
							process.stdout.on('data', function (data) {
								if (!config.showStdout) return;
								outputChannel.append(data.toString());
							});
							process.stderr.on('data', function (data) {
								if (!config.showStderr) return;
								outputChannel.appendLine('Error: ');
								outputChannel.appendLine(data.toString());
							});
							process.on('close', function () {
								if (runningStatus) {
									if (config.showInfo) {
										outputChannel.appendLine('Info: Execution time ' + getDuration(startTime, new Date()) + ' (mm:ss:fff)')
									}
									runningStatus.dispose();
									runningStatus = null;
								}
							});
							process.on('error', function (processError) {
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


						} catch (err) {
							outputChannel.appendLine(`Error`, err);
						}


					}, 500);
				}

				WebAppPanel.createOrShow(context.extensionUri);
			}
		)
	);

}

function deactivate() {
	if (process) {
		process.kill();
	}
}

// get a duration as Timestring (mm:ss.fff)
function getDuration(start, end) {
	const duration = new Date(end - start)
	return numPad(duration.getMinutes(), 1) + ':' + numPad(duration.getSeconds(), 2) + ':' + numPad(duration.getMilliseconds(), 3)
}
function getOS() {
	const userAgent = vscode.window.navigator.userAgent;
	const platform = vscode.window.navigator.platform;
	const macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];
	const windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"];
	const iosPlatforms = ["iPhone", "iPad", "iPod"];
	let os = null;

	if (macosPlatforms.indexOf(platform) !== -1) {
		os = "macOS";
	} else if (iosPlatforms.indexOf(platform) !== -1) {
		os = null;
	} else if (windowsPlatforms.indexOf(platform) !== -1) {
		os = "Windows";
	} else if (/Android/.test(userAgent)) {
		os = null;
	} else if (!os && /Linux/.test(platform)) {
		os = "Linux";
	}

	return os;
}
// Numberpadding
function numPad(number, size) {
	let result = number + ''
	while (result.length < size) {
		result = '0' + result
	}
	return result
}


module.exports = {
	activate,
	deactivate
}
