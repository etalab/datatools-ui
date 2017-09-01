import * as auth0 from 'auth0-js'
import fetch from 'isomorphic-fetch'
import { browserHistory } from 'react-router'

import { isTokenExpired } from '../util/jwtHelper'
import UserPermissions from './UserPermissions'
import { getConfigProperty } from '../util/config'

// TODO: Fix PNG import
const icon = '' // import icon from '../../assets/application_logo.png'

export default class Auth0Manager {
  constructor (props) {
    this.props = props
    this.webauth = new auth0.WebAuth({
        clientID: process.env.AUTH0_CLIENT_ID,
        domain: process.env.AUTH0_DOMAIN,
        redirectUri: window.location.href,
        responseType: "id_token token",
        scope: "openid",
    })
    this.webauth.parseHash(window.location.hash, (err, authResult) => {
        if (authResult && authResult.idToken) {
            window.location.hash = '';
            this.setSession(authResult);
        } else if (err) {
            console.log(err);
            const newLocation = authResult.state || ''
                browserHistory.push(newLocation)
                console.log(err);
            alert(`Error: ${err.error}. Check the console for further details.`);
        }
    })
  }

  loggedIn () {
    // Checks if there is a saved token and it's still valid
    const token = this.getToken()
    return !!token && !isTokenExpired(token)
  }

  getToken () {
    // Retrieves the user token from localStorage
    return window.localStorage.getItem('access_token')
  }

  getIdToken() {
    return window.localStorage.getItem('id_token')
  }

  setSession(authResult) {
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    window.localStorage.setItem('access_token', authResult.accessToken);
    window.localStorage.setItem('id_token', authResult.idToken);
    window.localStorage.setItem('expires_at', expiresAt);
  }

  unsetSession() {
    window.localStorage.removeItem('access_token')
    window.localStorage.removeItem('id_token')
    window.localStorage.removeItem('expires_at')
  }

  checkExistingLogin (props) {
    var access_token = this.getToken()
    var id_token = this.getIdToken()
    var client = this.webauth.client
    if (access_token != null) {
      return new Promise((resolve, reject) => {
        client.userInfo(access_token, (err, user) => {
          if (err)
            reject(err)
           resolve(constructUserObj(access_token, id_token, user));
        })
      });
    } else {
      return null
    }
  }

  login () {
      this.webauth.authorize({connection: "Datagouvfr"})
  }

  logout () {
    this.unsetSession()
    var redirect = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '')
    window.location.replace('https://' + this.props.domain + '/v2/logout?returnTo=' + redirect)
  }

  resetPassword () {
    this.lock.showReset((err) => {
      if (!err) this.lock.hide()
    })
  }

  setupSingleLogout () {
    setInterval(() => {
      // if the token is not in local storage, there is nothing to check (i.e. the user is already logged out)
      if (!this.getToken()) return

      this.webauth.getSSOData((err, data) => {
        // if there is still a session, do nothing
        if (err || (data && data.sso)) return

        // if we get here, it means there is no session on Auth0,
        // then remove the token and redirect to #login
        this.unsetSession()
        window.location.href = '/'
      })
    }, 5000)
  }
}

function constructUserObj (token, id_token, profile) {
    profile.metadata = profile.metadata ? profile.metadata : {"datatools": []}
    return {
       token,
       id_token,
       profile,
       permissions: new UserPermissions(profile.app_metadata.datatools)
     }
}

module.exports = Auth0Manager
