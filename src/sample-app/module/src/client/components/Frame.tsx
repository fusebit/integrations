import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { Avatar, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import StarIcon from '@mui/icons-material/Star';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { TenantData } from './Types';

function ListItemLink(
  props: React.PropsWithChildren<{
    to: string;
  }>
) {
  const { to } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef<any, Omit<RouterLinkProps, 'to'>>((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <ListItem button component={renderLink}>
      {props.children}
    </ListItem>
  );
}

const Frame = (props: React.PropsWithChildren<{ tenantData?: TenantData; onLogout: () => void }>) => {
  if (!props.tenantData.currentTenantId) {
    return <React.Fragment />;
  }
  const currentTenant = props.tenantData.tenants.find((tenant) => tenant.tenantId === props.tenantData.currentTenantId);
  return (
    <div>
      <Grid container className="navigation-drawer-grid null-pointer">
        <Grid item xs={2}>
          <Paper square className="navigation-drawer full-pointer">
            <List>
              <ListItem className="center-text">
                <Avatar>{currentTenant?.index + 1}</Avatar>
                <ListItemText>{currentTenant?.name}</ListItemText>
              </ListItem>
              <ListItem className="center-text">
                <ListItemText>Sample App</ListItemText>
              </ListItem>
              <Divider variant="middle" style={{ backgroundColor: 'white' }} />
              <ListItemLink to="/">
                <ListItemIcon>
                  <InboxIcon style={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText>Your Tasks</ListItemText>
              </ListItemLink>
              <ListItemLink to="/marketplace">
                <ListItemIcon>
                  <StarIcon style={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText>Integration Marketplace</ListItemText>
              </ListItemLink>
              <ListItem button onClick={props.onLogout}>
                <ListItemIcon>
                  <ExitToAppIcon style={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={5}>
        <Grid item xs={2} />
        <Grid item xs={10}>
          {props.children}
        </Grid>
      </Grid>
    </div>
  );
};

export default Frame;
