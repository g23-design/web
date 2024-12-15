import React from "react";
import { Link, withRouter } from "react-router-dom";
import {
  List,
  Divider,
  Typography,
  Grid,
  Avatar,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CircularProgress,
  Box,
  Button,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import axios from "axios";
import "./styles.css";

/**
 * UserPhotos component for displaying user photos and comments.
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: null,
      user: null,
      loading: true,
      error: null,
      advancedFeaturesEnabled: false, // "Нэмэлт сонголт"
      currentPhotoIndex: 0,
    };
  }

  // Fetch user data and photos when the component mounts
  async componentDidMount() {
    const { userId } = this.props.match.params;

    if (userId) {
      try {
        const [photoResponse, userResponse] = await Promise.all([
          axios.get(`http://localhost:3000/photosOfUser/${userId}`),
          axios.get(`http://localhost:3000/user/${userId}`)
        ]);

        this.setState({
          photos: photoResponse.data,
          user: userResponse.data,
          loading: false,
        });

        // Update the top bar with the user's full name if handler exists
        if (this.props.handler) {
          this.props.handler(`${userResponse.data.first_name} ${userResponse.data.last_name}`);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        this.setState({
          loading: false,
          error: "Error fetching data. Please try again later."
        });
      }
    }
  }

  handleNext = () => {
    const { currentPhotoIndex, photos } = this.state;
    const nextIndex = Math.min(photos.length - 1, currentPhotoIndex + 1);
    this.setState({ currentPhotoIndex: nextIndex });
    this.props.history.push(`/photos/${photos[nextIndex]._id}`); // Update the URL
  };

  handlePrevious = () => {
    const { currentPhotoIndex } = this.state;
    const prevIndex = Math.max(0, currentPhotoIndex - 1);
    this.setState({ currentPhotoIndex: prevIndex });
    this.props.history.push(`/photos/${this.state.photos[prevIndex]._id}`); // Update the URL
  };

  toggleAdvancedFeatures = (event) => {
    this.setState({ advancedFeaturesEnabled: event.target.checked });
  };

  render() {
    const { photos, user, loading, error, currentPhotoIndex, advancedFeaturesEnabled } = this.state;

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" maxHeight="80vh">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Typography color="error" align="center" variant="h6">
          {error}
        </Typography>
      );
    }

    const currentPhoto = photos[currentPhotoIndex];

    // Render the author link if user is available
    const linkToAuthor = user ? (
      <Link to={`/users/${user._id}`} style={{ textDecoration: "none", color: "inherit" }}>
        {`${user.first_name} ${user.last_name}`}
      </Link>
    ) : null;

    return (
      <Box>
        <FormControlLabel
          control={<Checkbox checked={advancedFeaturesEnabled} onChange={this.toggleAdvancedFeatures} />}
          label="Enable Stepper for Photos"
        />

        {/* If advanced features are enabled, show the single photo with comments */}
        {advancedFeaturesEnabled ? (
          <Box>
            <Card variant="outlined" style={{ marginBottom: "20px" }}>
              <CardHeader
                title={linkToAuthor}
                subheader={new Date(currentPhoto.date_time).toLocaleDateString()}
                avatar={<Avatar>{user ? user.first_name[0] : "U"}</Avatar>}
              />
              <CardMedia
                component="img"
                image={`./images/${currentPhoto.file_name}`}
                alt={`Photo by ${user ? user.first_name : "User"}`}
                loading="lazy"
                onError={(e) => {
                  e.target.src = "/images/placeholder.png";
                }}
              />
              <CardContent>
                {currentPhoto.comments && currentPhoto.comments.length > 0 ? (
                  <Typography variant="subtitle1">Comments:</Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No comments available.
                  </Typography>
                )}
                {currentPhoto.comments && currentPhoto.comments.map((comment) => (
                  <List key={comment._id} dense>
                    <Typography variant="subtitle2">
                      <Link to={`/users/${comment.user._id}`}>
                        {`${comment.user.first_name} ${comment.user.last_name}`}
                      </Link>
                    </Typography>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      {new Date(comment.date_time).toLocaleString()}
                    </Typography>
                    <Typography variant="body1">{`"${comment.comment}"`}</Typography>
                    <Divider />
                  </List>
                ))}
              </CardContent>
            </Card>

            <Box display="flex" justifyContent="center" maxHeight="80vh">
              <Button
                variant="contained"
                color="primary"
                onClick={this.handlePrevious}
                disabled={currentPhotoIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleNext}
                disabled={currentPhotoIndex === photos.length - 1}
              >
                Next
              </Button>
            </Box>
          </Box>
        ) : (
          // Show photos in regular grid layout if advanced features are disabled
          <Grid container spacing={3} justifyContent="center">
            {photos.map((photo) => (
              <Grid item xs={12} sm={6} md={4} key={photo._id}>
                <Card variant="outlined">
                  <CardHeader
                    title={linkToAuthor}
                    subheader={new Date(photo.date_time).toLocaleDateString()}
                    avatar={<Avatar>{user ? user.first_name[0] : "U"}</Avatar>}
                  />
                  <CardMedia
                    component="img"
                    image={`./images/${photo.file_name}`}
                    alt={`Photo by ${user ? user.first_name : "User"}`}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/images/placeholder.png";
                    }}
                  />
                  <CardContent>
                    {photo.comments && photo.comments.length > 0 ? (
                      <Typography variant="subtitle1">Comments:</Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No comments available.
                      </Typography>
                    )}
                    {photo.comments && photo.comments.map((comment) => (
                      <List key={comment._id} dense>
                        <Typography variant="subtitle2">
                          <Link to={`/users/${comment.user._id}`}>
                            {`${comment.user.first_name} ${comment.user.last_name}`}
                          </Link>
                        </Typography>
                        <Typography variant="caption" color="textSecondary" gutterBottom>
                          {new Date(comment.date_time).toLocaleString()}
                        </Typography>
                        <Typography variant="body1">{`"${comment.comment}"`}</Typography>
                        <Divider />
                      </List>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  }
}

export default withRouter(UserPhotos);
