// AWS Cognito Configuration for Amplify v6

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_PeNYwCXRn',
      userPoolClientId: '6ehv64bhjglup1i0dkvo2a8m68',
      loginWith: {
        oauth: {
          domain: 'us-east-1penywcxrn.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['http://localhost:3000/callback'],
          redirectSignOut: ['http://localhost:3000'],
          responseType: 'code',
          providers: ['Google']
        }
      }
    }
  }
};

export default awsConfig;
