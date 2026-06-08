targetScope = 'subscription'

@description('Azure region for the resource group and regional resources.')
param location string = 'australiaeast'

@description('Azure region for Azure Static Web Apps. australiaeast is not currently available for Microsoft.Web/staticSites.')
param staticWebAppLocation string = 'eastasia'

@description('Resource group name for the Wyuna website.')
param resourceGroupName string = 'rg-wyuna-website-prod'

@description('Azure Static Web App resource name.')
param staticWebAppName string = 'swa-wyuna-website-prod'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-07-01' = {
  name: resourceGroupName
  location: location
}

module website 'static-web-app.bicep' = {
  name: 'website'
  scope: resourceGroup
  params: {
    location: staticWebAppLocation
    staticWebAppName: staticWebAppName
  }
}

output resourceGroup string = resourceGroup.name
output staticWebAppName string = website.outputs.staticWebAppName
output defaultHostname string = website.outputs.defaultHostname
