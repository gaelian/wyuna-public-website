param communicationServiceName string
param emailServiceName string
param emailDomainName string
param emailSenderUsername string
param emailSenderDisplayName string

var dataLocation = 'Australia'

resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: emailServiceName
  location: 'global'
  properties: {
    dataLocation: dataLocation
  }
}

resource emailDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: emailDomainName
  location: 'global'
  properties: {
    domainManagement: 'CustomerManaged'
    userEngagementTracking: 'Disabled'
  }
}

resource senderUsername 'Microsoft.Communication/emailServices/domains/senderUsernames@2023-04-01' = {
  parent: emailDomain
  name: emailSenderUsername
  properties: {
    displayName: emailSenderDisplayName
    username: emailSenderUsername
  }
}

resource communicationService 'Microsoft.Communication/communicationServices@2023-03-31' = {
  name: communicationServiceName
  location: 'global'
  properties: {
    dataLocation: dataLocation
  }
}

output communicationServiceName string = communicationService.name
output emailServiceName string = emailService.name
output emailDomainName string = emailDomain.name
output senderAddress string = '${senderUsername.properties.username}@${emailDomain.name}'
