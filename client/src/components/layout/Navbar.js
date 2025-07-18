import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountCircle as AccountIcon,
  Favorite as FavoriteIcon,
  LocalPharmacy as PharmacyIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { updateSetting, fontSize } = useAccessibility();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [accessibilityMenu, setAccessibilityMenu] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleAccessibilityMenuOpen = (event) => {
    setAccessibilityMenu(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
    setAccessibilityMenu(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { label: 'Search', path: '/search', icon: <SearchIcon /> },
    ...(isAuthenticated ? [
      { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
      { label: 'Favorites', path: '/favorites', icon: <FavoriteIcon /> },
      { label: 'Reservations', path: '/reservations', icon: <PharmacyIcon /> },
    ] : []),
    ...(user?.role === 'pharmacist' ? [
      { label: 'Pharmacy Dashboard', path: '/pharmacy-dashboard', icon: <PharmacyIcon /> },
    ] : []),
  ];

  const ProfileMenu = () => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      onClick={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          minWidth: 200,
          '& .MuiMenuItem-root': {
            px: 2,
            py: 1,
          },
        },
      }}
    >
      <MenuItem onClick={() => handleNavigation('/profile')}>
        <AccountIcon sx={{ mr: 1 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={() => handleNavigation('/dashboard')}>
        <DashboardIcon sx={{ mr: 1 }} />
        Dashboard
      </MenuItem>
      <MenuItem onClick={() => handleNavigation('/favorites')}>
        <FavoriteIcon sx={{ mr: 1 }} />
        Favorites
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => handleNavigation('/settings')}>
        <SettingsIcon sx={{ mr: 1 }} />
        Settings
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <LogoutIcon sx={{ mr: 1 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  const AccessibilityMenu = () => (
    <Menu
      anchorEl={accessibilityMenu}
      open={Boolean(accessibilityMenu)}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          minWidth: 200,
        },
      }}
    >
      <MenuItem>
        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
          Font Size
        </Typography>
      </MenuItem>
      {['small', 'medium', 'large'].map((size) => (
        <MenuItem
          key={size}
          onClick={() => {
            updateSetting('fontSize', size);
            handleMenuClose();
          }}
          selected={fontSize === size}
        >
          <Typography sx={{ textTransform: 'capitalize' }}>
            {size} ({size === 'small' ? '14px' : size === 'medium' ? '16px' : '20px'})
          </Typography>
        </MenuItem>
      ))}
    </Menu>
  );

  const MobileMenu = () => (
    <Menu
      anchorEl={mobileMenuAnchor}
      open={Boolean(mobileMenuAnchor)}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          minWidth: 250,
        },
      }}
    >
      {menuItems.map((item) => (
        <MenuItem
          key={item.path}
          onClick={() => handleNavigation(item.path)}
          selected={isActiveRoute(item.path)}
        >
          {item.icon}
          <Typography sx={{ ml: 1 }}>{item.label}</Typography>
        </MenuItem>
      ))}
      {!isAuthenticated && (
        <>
          <Divider />
          <MenuItem onClick={() => handleNavigation('/login')}>
            <AccountIcon sx={{ mr: 1 }} />
            Login
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/register')}>
            <AccountIcon sx={{ mr: 1 }} />
            Register
          </MenuItem>
        </>
      )}
    </Menu>
  );

  return (
    <AppBar 
      position="sticky" 
      elevation={2}
      sx={{ 
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: '1px solid',
        borderColor: theme.palette.divider,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Title */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <PharmacyIcon 
            sx={{ 
              fontSize: 32, 
              color: theme.palette.primary.main,
              mr: 1,
            }} 
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
            }}
          >
            Find my Med
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                startIcon={item.icon}
                sx={{
                  color: isActiveRoute(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.primary,
                  fontWeight: isActiveRoute(item.path) ? 600 : 400,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Right Side Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Accessibility Button */}
          <IconButton
            onClick={handleAccessibilityMenuOpen}
            color="inherit"
            title="Accessibility Options"
          >
            <AccessibilityIcon />
          </IconButton>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <IconButton color="inherit" title="Notifications">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* User Profile */}
              <IconButton
                onClick={handleProfileMenuOpen}
                color="inherit"
                title={`${user?.name} - ${user?.role}`}
              >
                {user?.avatar ? (
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                )}
              </IconButton>
            </>
          ) : (
            !isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{ borderRadius: 2 }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  sx={{ borderRadius: 2 }}
                >
                  Register
                </Button>
              </Box>
            )
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              onClick={handleMobileMenuOpen}
              color="inherit"
              title="Menu"
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>

      {/* Menus */}
      <ProfileMenu />
      <AccessibilityMenu />
      <MobileMenu />
    </AppBar>
  );
};

export default Navbar;