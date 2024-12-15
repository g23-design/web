import React, { useState } from "react";
import { Typography, Grid, TextField, Button, Paper } from "@mui/material";
import { Redirect, useHistory } from "react-router-dom";
import axios from "axios";

const LoginRegister = ({ onLoginUserChange }) => {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [newLoginName, setNewLoginName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [registeredMessage, setRegisteredMessage] = useState('');
  const [redirectToUser, setRedirectToUser] = useState(false);
  const history = useHistory();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/admin/login', { login_name: loginName, password });
      onLoginUserChange({ ...response.data, loginName });
      history.push('/');
    } catch (err) {
      setLoginMessage('Login failed: ' + err.response.data);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== newPassword2) {
      setRegisteredMessage("The two passwords do not match. Please try again.");
      return;
    }

    const newUser = {
      login_name: newLoginName,
      password: newPassword,
      first_name: firstName,
      last_name: lastName,
      description,
      location,
      occupation,
    };

    try {
      const response = await axios.post("/user", newUser);
      setRegisteredMessage(response.data.message);
      if (response.data.success) {
        setRedirectToUser(true);
      }
    } catch (error) {
      setRegisteredMessage(error.response ? error.response.data.message : "An error occurred");
    }
  };

  if (redirectToUser) {
    return <Redirect to={`/users/${newLoginName || loginName}`} />;
  }

  return (
    <Grid container spacing={2}>
      {/* Login Form */}
      <Grid item xs={6} container direction="column" alignItems="center">
        <Typography variant="h5">Log In</Typography>
        <form onSubmit={handleLogin} style={{ width: "100%" }}>
          <TextField
            label="Login Name"
            variant="outlined"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Login
          </Button>
          {loginMessage && (
            <Typography style={{ color: "red", marginTop: "10px" }}>
              {loginMessage}
            </Typography>
          )}
        </form>
      </Grid>

      {/* Register Form */}
      <Grid item xs={6} container direction="column" alignItems="center">
        <Typography variant="h5">Create New Account</Typography>
        <form onSubmit={handleRegisterSubmit} style={{ width: "100%" }}>
          <TextField
            label="New Login Name"
            variant="outlined"
            value={newLoginName}
            onChange={(e) => setNewLoginName(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="First Name"
            variant="outlined"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Last Name"
            variant="outlined"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Location"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Occupation"
            variant="outlined"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="New Password"
            type="password"
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Re-enter Password"
            type="password"
            variant="outlined"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Register Me
          </Button>
          {registeredMessage && (
            <Typography
              style={{
                color: registeredMessage.includes("successfully") ? "green" : "red",
                marginTop: "10px",
              }}
            >
              {registeredMessage}
            </Typography>
          )}
        </form>
      </Grid>
    </Grid>
  );
};

export default LoginRegister;
