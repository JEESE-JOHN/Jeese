import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  LocalPharmacy as PharmacyIcon,
  AccessTime as TimeIcon,
  Verified as VerifiedIcon,
  Mic as MicIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useSpeechSynthesis } from 'react-speech-kit';

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { speak } = useSpeechSynthesis();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        speak({ text: 'Listening for your medicine search' });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        speak({ text: `Searching for ${transcript}` });
        navigate(`/search?q=${encodeURIComponent(transcript)}`);
      };

      recognition.onerror = () => {
        speak({ text: 'Sorry, voice search is not available' });
      };

      recognition.start();
    } else {
      speak({ text: 'Voice search is not supported in this browser' });
    }
  };

  const popularMedicines = [
    'Paracetamol',
    'Ibuprofen',
    'Cetirizine',
    'Omeprazole',
    'Vitamin D3',
    'Metformin',
  ];

  const features = [
    {
      icon: <SearchIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Smart Search',
      description: 'Find medicines by name, brand, or salt composition with intelligent suggestions',
    },
    {
      icon: <LocationIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Nearby Pharmacies',
      description: 'Locate pharmacies near you with real-time availability and directions',
    },
    {
      icon: <TimeIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Real-time Stock',
      description: 'Check live inventory levels and reserve medicines for pickup',
    },
    {
      icon: <VerifiedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Verified Pharmacies',
      description: 'All pharmacies are licensed and verified for your safety',
    },
  ];

  const stats = [
    { number: '500+', label: 'Verified Pharmacies' },
    { number: '10,000+', label: 'Medicines Available' },
    { number: '50,000+', label: 'Happy Customers' },
    { number: '24/7', label: 'Support Available' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                Find my Med
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                }}
              >
                Discover medicines in nearby pharmacies with real-time availability.
                Reserve, locate, and stay healthy with ease.
              </Typography>

              {/* Search Bar */}
              <Paper
                component="form"
                onSubmit={handleSearch}
                sx={{
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  mb: 3,
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Search for medicines, brands, or conditions..."
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleVoiceSearch}
                          color="primary"
                          title="Voice Search"
                        >
                          <MicIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { '& .MuiOutlinedInput-notchedOutline': { border: 'none' } },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ ml: 1, px: 3, borderRadius: 1.5 }}
                >
                  Search
                </Button>
              </Paper>

              {/* Popular Searches */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                  Popular searches:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {popularMedicines.map((medicine) => (
                    <Chip
                      key={medicine}
                      label={medicine}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(medicine)}`)}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.3)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: { xs: 'none', md: 'block' },
                  textAlign: 'center',
                }}
              >
                <Box
                  component="img"
                  src="/api/placeholder/600/400"
                  alt="Find my Med - Medicine Search Platform"
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    height: 'auto',
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, backgroundColor: theme.palette.background.paper }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box textAlign="center">
                  <Typography
                    variant="h3"
                    component="div"
                    color="primary"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            Why Choose Find my Med?
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
          >
            Experience the future of medicine discovery with our comprehensive platform
            designed for your convenience and health.
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 8,
          background: `linear-gradient(45deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Container maxWidth="md" textAlign="center">
          <Typography variant="h3" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
            Ready to Find Your Medicine?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of users who trust Find my Med for their healthcare needs.
            Start your search today!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/search')}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.secondary.main,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                },
              }}
              startIcon={<SearchIcon />}
            >
              Start Searching
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
              startIcon={<FavoriteIcon />}
            >
              Join Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;