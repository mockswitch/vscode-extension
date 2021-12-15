const vscode = require('vscode');

class WebAppPanel {

    static currentPanel = undefined;

    static viewType = "mockswitch:panel";

    _panel = undefined;
    _extensionUri;
    _disposables = [];

    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.      
        if (WebAppPanel.currentPanel) {
            WebAppPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel. 
        const panel = vscode.window.createWebviewPanel(
            WebAppPanel.viewType,
            'Mockswitch',
            column || vscode.ViewColumn.One,
            getWebviewOptions(extensionUri),
        );

        WebAppPanel.currentPanel = new WebAppPanel(panel, extensionUri);
    }

    static kill() {
        WebAppPanel.currentPanel?.dispose();
        WebAppPanel.currentPanel = undefined;
    }

    static revive(panel,
        extensionUri) {
        WebAppPanel.currentPanel = new WebAppPanel(panel, extensionUri);
    }

    constructor(panel,
        extensionUri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content    
        this._update();

        this._panel.onDidDispose(() => this.dispose(),
            null, this._disposables);

        // Update the content based on view changes 
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview  
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert': vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    dispose() {
        WebAppPanel.currentPanel = undefined;

        // Clean up our resources  
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    _getHtmlForWebview(webview) {
        return `      
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mockswitch</title>
        </head>
        <body style="padding:0;">
            <iframe style="    width: 100%;
            min-height: 800px;
            sandbox="allow-scripts allow-popups allow-same-origin"
            border: none;" frameBorder="0" src='http://localhost:1026'> </iframe>
        </body>
        </html> `;
    }
}
function getWebviewOptions() {
    return {
        enableScripts: true,
    };
}

module.exports = {
	WebAppPanel
}
