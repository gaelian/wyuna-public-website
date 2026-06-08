targetScope = 'subscription'

@description('Azure region for the resource group and regional resources.')
param location string = 'australiaeast'

@description('Azure region for Azure Static Web Apps. australiaeast is not currently available for Microsoft.Web/staticSites.')
param staticWebAppLocation string = 'eastasia'

@description('Resource group name for the Wyuna website.')
param resourceGroupName string = 'rg-wyuna-website-prod'

@description('Azure Static Web App resource name.')
param staticWebAppName string = 'swa-wyuna-website-prod'

@description('Azure Communication Services resource name.')
param communicationServiceName string = 'acs-wyuna-website-prod'

@description('Azure Email Communication Service resource name.')
param emailServiceName string = 'acs-email-wyuna-website-prod'

@description('Custom sender domain for Azure Communication Services Email.')
param emailDomainName string = 'wyunacommunity.org'

@description('Mail-from username under the custom sender domain.')
param emailSenderUsername string = 'contact.form'

@description('Display name for contact form emails.')
param emailSenderDisplayName string = 'Wyuna Community Inc'

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

module communication 'communication-email.bicep' = {
  name: 'communication-email'
  scope: resourceGroup
  params: {
    communicationServiceName: communicationServiceName
    emailServiceName: emailServiceName
    emailDomainName: emailDomainName
    emailSenderUsername: emailSenderUsername
    emailSenderDisplayName: emailSenderDisplayName
  }
}

output resourceGroup string = resourceGroup.name
output staticWebAppName string = website.outputs.staticWebAppName
output defaultHostname string = website.outputs.defaultHostname
output communicationServiceName string = communication.outputs.communicationServiceName
output emailServiceName string = communication.outputs.emailServiceName
output emailDomainName string = communication.outputs.emailDomainName
output senderAddress string = communication.outputs.senderAddress
