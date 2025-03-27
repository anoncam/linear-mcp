import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Registers organization-related resources with the MCP server.
 */
export function registerOrganizationResources(server: McpServer, linearClient: LinearClient) {
  // Resource for organization details
  server.resource(
    "organization",
    new ResourceTemplate("linear://organization", { list: undefined }),
    {
      description: "Information about the Linear organization",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch organization data using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query OrganizationDetails {
          organization {
            id
            name
            urlKey
            createdAt
            logoUrl
            samlEnabled
            userCount
            createdIssueCount
            completedIssueCount
            canceledIssueCount
            allowedAuthServices
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const organization = result.organization;
      
      // Format the organization data for display
      let formattedOrg = `# ${organization.name}\n\n`;
      
      formattedOrg += `Organization ID: ${organization.id}\n`;
      formattedOrg += `URL Key: ${organization.urlKey}\n`;
      formattedOrg += `Created: ${new Date(organization.createdAt).toLocaleDateString()}\n\n`;
      
      formattedOrg += `## Statistics\n\n`;
      formattedOrg += `Users: ${organization.userCount}\n`;
      formattedOrg += `Created Issues: ${organization.createdIssueCount}\n`;
      formattedOrg += `Completed Issues: ${organization.completedIssueCount}\n`;
      formattedOrg += `Canceled Issues: ${organization.canceledIssueCount}\n\n`;
      
      formattedOrg += `## Settings\n\n`;
      formattedOrg += `SAML Enabled: ${organization.samlEnabled ? 'Yes' : 'No'}\n`;
      
      if (organization.allowedAuthServices?.length > 0) {
        formattedOrg += `Allowed Auth Services: ${organization.allowedAuthServices.join(', ')}\n`;
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedOrg,
        }]
      };
    }
  );

  // Resource for organization subscription details
  server.resource(
    "subscription",
    new ResourceTemplate("linear://organization/subscription", { list: undefined }),
    {
      description: "Subscription information for the Linear organization",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch subscription data using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query SubscriptionDetails {
          organization {
            id
            name
            subscription {
              id
              type
              tier
              seats
              trialEnds
              periodStart
              periodEnd
              collection
              currency
              autoRenew
            }
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const organization = result.organization;
      const subscription = organization.subscription;
      
      // Format the subscription data for display
      let formattedSub = `# ${organization.name} Subscription\n\n`;
      
      if (!subscription) {
        return {
          contents: [{
            uri: uri.href,
            text: formattedSub + "No subscription information available.",
          }]
        };
      }
      
      formattedSub += `Subscription ID: ${subscription.id}\n`;
      formattedSub += `Type: ${subscription.type || 'Unknown'}\n`;
      formattedSub += `Tier: ${subscription.tier || 'Unknown'}\n`;
      
      if (subscription.seats) {
        formattedSub += `Seats: ${subscription.seats}\n`;
      }
      
      if (subscription.periodStart) {
        formattedSub += `Period Start: ${new Date(subscription.periodStart).toLocaleDateString()}\n`;
      }
      
      if (subscription.periodEnd) {
        formattedSub += `Period End: ${new Date(subscription.periodEnd).toLocaleDateString()}\n`;
      }
      
      if (subscription.trialEnds) {
        formattedSub += `Trial Ends: ${new Date(subscription.trialEnds).toLocaleDateString()}\n`;
      }
      
      if (subscription.currency) {
        formattedSub += `Currency: ${subscription.currency}\n`;
      }
      
      formattedSub += `Auto Renew: ${subscription.autoRenew ? 'Yes' : 'No'}\n`;
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedSub,
        }]
      };
    }
  );

  // Resource for organization allowed auth services
  server.resource(
    "authServices",
    new ResourceTemplate("linear://organization/auth-services", { list: undefined }),
    {
      description: "Allowed authentication services for the Linear organization",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch auth services data using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query AuthServicesDetails {
          organization {
            id
            name
            allowedAuthServices
            samlEnabled
            oidcEnabled
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const organization = result.organization;
      
      // Format the auth services data for display
      let formattedAuth = `# ${organization.name} Authentication Services\n\n`;
      
      if (organization.allowedAuthServices?.length > 0) {
        formattedAuth += `## Allowed Authentication Services\n\n`;
        organization.allowedAuthServices.forEach((service: string) => {
          formattedAuth += `- ${service}\n`;
        });
        formattedAuth += `\n`;
      } else {
        formattedAuth += `No specific authentication services are restricted.\n\n`;
      }
      
      formattedAuth += `## Enterprise Authentication\n\n`;
      formattedAuth += `SAML Authentication: ${organization.samlEnabled ? 'Enabled' : 'Disabled'}\n`;
      formattedAuth += `OIDC Authentication: ${organization.oidcEnabled ? 'Enabled' : 'Disabled'}\n`;
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedAuth,
        }]
      };
    }
  );
}
