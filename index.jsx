import React from "react";
import PropTypes from "prop-types";
import { AppBar, Toolbar, Typography, CircularProgress, Button } from "@mui/material";
import { withRouter } from "react-router-dom";
import axios from "axios";

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentContext: "User List",
      isLoadingContext: false,
      user: null,
    };
  }

  componentDidMount() {
    this.updateContextBasedOnPath(this.props.location.pathname);
    this.checkUserLogin();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.updateContextBasedOnPath(this.props.location.pathname);
    }
  }

  async updateContextBasedOnPath(path) {
    this.setState({ isLoadingContext: true });

    try {
      if (path.startsWith("/users/")) {
        const userId = path.split("/")[2];
        const response = await axios.get(`/user/${userId}`);
        const user = response.data;
        this.setState({
          currentContext: `${user.first_name} ${user.last_name}`,
          isLoadingContext: false,
        });
      } else if (path.startsWith("/photos/")) {
        const userId = path.split("/")[2];
        const response = await axios.get(`/user/${userId}`);
        const user = response.data;
        this.setState({
          currentContext: `Photos of ${user.first_name} ${user.last_name}`,
          isLoadingContext: false,
        });
      } else {
        this.setState({ currentContext: "User List", isLoadingContext: false });
      }
    } catch (error) {
      console.error("Error fetching context:", error);
      this.setState({ currentContext: "Error loading context", isLoadingContext: false });
    }
  }

  async checkUserLogin() {
    try {
      const response = await axios.get("/admin/status");
      this.setState({ user: response.data });
    } catch (error) {
      this.setState({ user: null });
    }
  }

  handleLogout = () => {
    axios
      .post("/admin/logout")
      .then(() => {
        this.setState({ user: null });
        this.props.history.push("/login");
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  render() {
    const { currentContext, isLoadingContext, user } = this.state;

    return (
      <AppBar position="static">
        <Toolbar>
          {/* Left: App Title */}
          <Typography variant="h6" style={{ flex: 1 }}>
            Зурагаа хуваалцая
          </Typography>

          {/* Right: Current Context */}
          {isLoadingContext ? (
            <CircularProgress size={24} style={{ color: "white", marginRight: "20px" }} />
          ) : (
            <Typography variant="h6" style={{ marginRight: "20px" }}>
              {currentContext}
            </Typography>
          )}

          {/* Right: User Login/Logout */}
          {user ? (
            <>
              <Typography variant="h6" style={{ marginRight: "20px" }}>
                Hi {user.first_name}
              </Typography>
              <Button color="inherit" onClick={this.handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => this.props.history.push("/login")}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
    );
  }
}

TopBar.propTypes = {
  location: PropTypes.object.isRequired,
};

export default withRouter(TopBar);
