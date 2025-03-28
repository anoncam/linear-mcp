# Linear MCP Server

A Model Context Protocol (MCP) server for Linear, providing AI assistants with access to Linear's project management capabilities.

## Features

- **Resources:** Access issues, projects, teams, users, roadmaps, documents, initiatives, and more
- **Tools:** Create and update issues, manage projects, search, link projects to initiatives
- **Prompts:** Templates for issue creation, bug reports, feature requests, and more

## Setup

### Prerequisites

- Node.js 18 or later
- A Linear API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/linear-mcp.git
   cd linear-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Linear API key:
   ```
   LINEAR_API_KEY=your_linear_api_key_here
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Command-line (stdio)

To run the server with stdio transport (for use with CLI tools that support MCP):

```bash
npm start
```

Or:

```bash
node dist/index.js stdio
```

### HTTP Server (for remote connections)

To run the server as an HTTP service with Server-Sent Events (SSE):

```bash
node dist/index.js http
```

This will start an HTTP server on port 3000 (configurable via PORT environment variable).

### Development Mode

To run in development mode with automatic reloading:

```bash
npm run dev
```

### Claude Desktop Integration

To use this server with Claude Desktop:

1. Build the project:
   ```bash
   npm run build
   ```

2. In Claude Desktop, go to Settings → Advanced → MCP Configuration.

3. Add the following configuration (adjust paths to match your installation):
   ```json
   {
     "mcpServers": {
       "linear": {
         "command": "node",
         "args": [
           "/path/to/linear-mcp/dist/index.js"
         ],
         "env": {
           "LINEAR_API_KEY": "your_linear_api_key_here"
         }
       }
     }
   }
   ```

4. Save the configuration and restart Claude Desktop.

Alternatively, you can copy the provided `claude-desktop-config.json` file and modify the paths to match your installation.

## Resources

The server provides access to all major Linear entities as resources:

### Core Resources
- **Issues:** `linear://issues` and `linear://issues/{id}`
- **Teams:** `linear://teams` and `linear://teams/{id}`
- **Projects:** `linear://projects` and `linear://projects/{id}`
- **Users:** `linear://users` and `linear://users/{id}`
- **Initiatives:** `linear://initiatives` and `linear://initiatives/{id}`

### Additional Resources
- **Roadmaps:** `linear://roadmaps` and `linear://roadmaps/{id}`
- **Milestones:** `linear://milestones` and `linear://milestones/{id}`
- **Documents:** `linear://documents` and `linear://documents/{id}`
- **Integrations:** `linear://integrations` and `linear://integrations/{id}`
- **Organization:** `linear://organization`

### Specialized Resources
- `linear://teams/{teamId}/issues` - Issues for a specific team
- `linear://users/{userId}/issues` - Issues assigned to a specific user
- `linear://projects/{projectId}/issues` - Issues in a specific project
- `linear://teams/{teamId}/states` - Workflow states for a team
- `linear://teams/{teamId}/labels` - Labels for a team
- `linear://teams/{teamId}/cycles` - Cycles for a team
- `linear://teams/{teamId}/members` - Members of a team
- `linear://teams/{teamId}/documents` - Documents for a team
- `linear://projects/{projectId}/documents` - Documents for a project
- `linear://projects/{projectId}/initiative` - Initiative associated with a project
- `linear://initiatives/{initiativeId}/projects` - Projects associated with an initiative
- `linear://milestones/{milestoneId}/projects` - Projects for a milestone
- `linear://organization/subscription` - Organization subscription details
- `linear://organization/auth-services` - Organization authentication services
- `linear://integration-services` - Available integration services

## Tools

The server provides tools for:

- **Issue Management**
  - Creating new issues
  - Updating existing issues
  - Adding comments to issues

- **Project Management**
  - Creating new projects
  - Updating existing projects
  - Adding issues to projects

- **Initiative Management**
  - Creating initiatives
  - Linking projects to initiatives
  - Unlinking projects from initiatives

- **Search Capabilities**
  - Comprehensive search across Linear entities
  - Finding issues with specific criteria

## Prompts

The server provides prompt templates for:

- **Issue Related**
  - Creating new issues
  - Creating bug reports
  - Creating feature requests

- **Project Related**
  - Creating new projects
  - Planning projects with issues
  - Creating project status updates

## Testing

Test with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector stdio -- npm start
```

Or, if running in HTTP mode, open the MCP Inspector in your browser and connect to your server's URL.

## Environment Variables

- `LINEAR_API_KEY` (required): Your Linear API key
- `SERVER_PORT` (optional): Port for HTTP server (default: 3000)
- `LOG_LEVEL` (optional): Logging level (default: info)

## License

MIT
