// Check if we're running in Cursor
if (typeof process === 'undefined' || !process.versions.node) {
    // We're in Cursor environment
    const { MCPServer, BrowserToolsMCP } = globalThis;

    class PuterMCPServer extends MCPServer {
        constructor() {
            super('puter');
            this.browserTools = null;
        }

        async initialize() {
            this.browserTools = new BrowserToolsMCP();
            await this.browserTools.evaluateInPage(`
                if (!window.puter) {
                    const script = document.createElement('script');
                    script.src = 'https://js.puter.com/v2/';
                    document.head.appendChild(script);
                    await new Promise(resolve => script.onload = resolve);
                }
            `);
        }

        async handleRequest(request) {
            if (!this.browserTools) {
                await this.initialize();
            }

            try {
                const result = await this.browserTools.evaluateInPage(`
                    (async () => {
                        try {
                            const response = await puter.ai.chat("${request.prompt}");
                            return { success: true, response };
                        } catch (error) {
                            return { success: false, error: error.message };
                        }
                    })()
                `);

                return {
                    type: 'response',
                    content: result.response,
                    success: result.success
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: error.message,
                    success: false
                };
            }
        }
    }

    // Start the MCP server
    const server = new PuterMCPServer();
    server.start().catch(console.error);
} else {
    // We're in Node.js environment
    console.log('This script should be run inside Cursor, not directly with Node.js.');
    console.log('Please use this script through Cursor\'s MCP system.');
    process.exit(1);
}

// Export the MCP server configuration
const mcpServer = {
    name: 'puter',
    version: '1.0.0',
    description: 'Puter integration for Cursor',
    
    // Initialize the server
    async initialize() {
        this.browserTools = new BrowserToolsMCP();
        await this.browserTools.evaluateInPage(`
            if (!window.puter) {
                const script = document.createElement('script');
                script.src = 'https://js.puter.com/v2/';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
        `);
    },

    // Handle requests from Cursor
    async handleRequest(request) {
        if (!this.browserTools) {
            await this.initialize();
        }

        try {
            const result = await this.browserTools.evaluateInPage(`
                (async () => {
                    try {
                        const response = await puter.ai.chat("${request.prompt}");
                        return { success: true, response };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                })()
            `);

            return {
                type: 'response',
                content: result.response,
                success: result.success
            };
        } catch (error) {
            return {
                type: 'error',
                content: error.message,
                success: false
            };
        }
    }
};

// Export for Cursor MCP
module.exports = { mcpServer }; 