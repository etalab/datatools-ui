import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import PublicHeader from '../components/PublicHeader'

import { login, logout } from '../../manager/actions/user'
import { getConfigProperty } from '../../common/util/config'

const mapStateToProps = (state, ownProps) => {
  return {
    title: getConfigProperty('application.title'),
    managerUrl: '/project',
    editorUrl: null,
    userAdminUrl: null,
    alertsUrl: null,
    signConfigUrl: null,
    username: state.user.profile ? state.user.profile.email : null,
    userPicture: state.user.profile ? state.user.profile.picture : null
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    loginHandler: () => dispatch(login()),
    logoutHandler: () => dispatch(logout()),
  }
}

const ActivePublicHeader = connect(
  mapStateToProps,
  mapDispatchToProps
)(PublicHeader)

export default ActivePublicHeader
