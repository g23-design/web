import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom'; // Redirect импортлох
import { Grid, Typography, Paper } from '@mui/material';
import './styles/main.css';

// Компонентуудыг импортолно
import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginUser: null,  // Хэрэглэгчийн мэдээлэл
    };
  }

  // Нэвтэрсэн хэрэглэгчийн мэдээллийг авах
  handleLoginUserChange = (loginUser) => this.setState({ loginUser });

  render() {
    const { loginUser } = this.state;

    return (
      <HashRouter>
        <div>
          <Grid container spacing={1}>
            {/* TopBar */}
            <Grid item xs={12}>
              <TopBar loginUser={loginUser} />
            </Grid>

            <div className="cs142-main-topbar-buffer" />

            {/* Sidebar */}
            <Grid item sm={3}>
              <Paper className="side-bar" elevation={3}>
                <UserList loginUser={loginUser} />
              </Paper>
            </Grid>

            {/* Main content */}
            <Grid item sm={9}>
              <Paper className="cs142-main-grid-item" elevation={3}>
                <Switch>
                  {/* Login/Register View */}
                  <Route
                    path="/login-register"
                    component={() => <LoginRegister onLoginUserChange={this.handleLoginUserChange} />}
                  />
                  {/* User Detail View */}
                  <Route
                    path="/users/:userId"
                    render={() => (loginUser ? <UserDetail /> : <Redirect to="/login-register" />)}
                  />
                  {/* User Photos View */}
                  <Route
                    path="/photos/:userId"
                    render={() => (loginUser ? <UserPhotos /> : <Redirect to="/login-register" />)}
                  />
                  {/* User list */}
                  <Route
                    path="/users"
                    render={() => (loginUser ? <UserList loginUser={loginUser} /> : <Redirect to="/login-register" />)}
                  />
                  {/* Home page */}
                  <Route
                    path="/"
                    render={() => (loginUser ? (
                      <Typography variant="h3">Welcome to my photo-sharing app!</Typography>
                    ) : (
                      <Redirect to="/login-register" />
                    ))}
                  />
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(<PhotoShare />, document.getElementById('photoshareapp'));
