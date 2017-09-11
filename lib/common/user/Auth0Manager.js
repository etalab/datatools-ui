import * as auth0 from 'auth0-js'
import fetch from 'isomorphic-fetch'
import { browserHistory } from 'react-router'

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
        responseType: "token",
        scope: "openid",
    })
    this.webauth.parseHash(window.location.hash,
      (err, authResult) => {this.auth(err, authResult)}
    )
    if (this.isRenewNeeded()) {
        return this.renewAuth((err, authResult) => {this.auth(err, authResult)})
    }
  }

  isTokenExpired() {
    return new Date().getTime() > window.localStorage.getItem("expires_at")
  }

  renewAuth(callback) {
      return this.webauth.renewAuth({
            scope: "openid",
            redirectUri: window.location.href,
            responseType: "token",
        }, callback)
  }

  isRenewNeeded() {
      return !!this.getToken() && this.isTokenExpired();
  }

  auth(err, authResult) {
    if (authResult && authResult.idToken) {
        window.location.hash = '';
        return this.setSession(authResult);
    } else if (err) {
        console.log(err);
        const newLocation = authResult.state || ''
            browserHistory.push(newLocation)
            console.log(err);
        alert(`Error: ${err.error}. Check the console for further details.`);
    }
    return false;
  }

  loggedIn () {
    // Checks if there is a saved token and it's still valid
    const token = this.getToken()
    return !!token && !this.isTokenExpired()
  }

  getToken () {
    // Retrieves the user token from localStorage
    return window.localStorage.getItem('access_token')
  }

  getExpireDate() {
    return window.localStorage.getItem('expires_at')
  }

  setSession(authResult) {
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    window.localStorage.setItem('access_token', authResult.accessToken);
    window.localStorage.setItem('expires_at', expiresAt);
    return true;
  }

  unsetSession() {
    window.localStorage.removeItem('access_token')
    window.localStorage.removeItem('expires_at')
  }

  checkExistingLogin (props) {
    if (this.getToken() != null) {
      if (this.isRenewNeeded()) {
        return new Promise((resolve, reject) => {
          this.renewAuth((err, authResult) => {
            if (this.auth(err, authResult)) {
                return this.promise_userInfo(props)
            } else {
                return null
            }
          })
        })
      }
      return this.promise_userInfo(props)
    } else {
      return null
    }
  }

  promise_userInfo(props) {
    var access_token = this.getToken()
    var client = this.webauth.client
    return new Promise((resolve, reject) => {
      client.userInfo(access_token, (err, user) => {
        if (err) {
          console.log(err)
          this.unsetSession()
          return reject(err)
        }
         return resolve(constructUserObj(access_token, user));
      })
    });
  }

  login () {
      this.webauth.authorize({connection: "Datagouvfr"})
  }

  logout () {
    this.unsetSession()
    var redirect = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '')
    window.location.replace('https://' + this.props.domain + '/v2/logout?returnTo=' + redirect)
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

function constructUserObj (token, profile) {
    profile.app_metadata = profile.app_metadata ? profile.app_metadata : {"datatools": []}
    return {
       token,
       profile,
       permissions: new UserPermissions(profile.app_metadata.datatools)
     }
}

module.exports = Auth0Manager
