param location string
param staticWebAppName string

resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    buildProperties: {
      appLocation: 'site'
      apiLocation: 'api'
      appArtifactLocation: ''
    }
  }
}

output staticWebAppName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
